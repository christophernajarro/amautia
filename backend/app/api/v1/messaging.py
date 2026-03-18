"""Messaging: conversations, announcements, forums."""
import uuid
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, and_
from app.core.database import get_db
from app.core.dependencies import get_current_user, get_profesor
from app.core.utils import parse_uuid
from app.models.user import User
from app.models.message import (
    Conversation, ConversationMember, Message,
    Announcement, Forum, ForumPost,
)
from app.models.section import Section, SectionStudent
from app.models.subject import Subject

logger = logging.getLogger(__name__)

router = APIRouter()


# ─── Request / Response schemas ───

class CreateConversationRequest(BaseModel):
    type: str = "direct"  # direct, group
    title: str | None = None
    member_ids: list[str]


class SendMessageRequest(BaseModel):
    content: str
    message_type: str = "text"
    file_url: str | None = None


class CreateAnnouncementRequest(BaseModel):
    section_id: str
    title: str
    content: str
    is_pinned: bool = False


class UpdateAnnouncementRequest(BaseModel):
    title: str | None = None
    content: str | None = None
    is_pinned: bool | None = None


class CreateForumRequest(BaseModel):
    section_id: str
    title: str
    description: str | None = None


class CreateForumPostRequest(BaseModel):
    content: str
    parent_id: str | None = None


# ─── Conversations ───

@router.post("/conversations")
async def create_conversation(
    data: CreateConversationRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Create a direct or group conversation."""
    if not data.member_ids:
        raise HTTPException(400, "Se requiere al menos un miembro")

    if data.type not in ("direct", "group"):
        raise HTTPException(400, "Tipo de conversación inválido")

    # For direct conversations, enforce exactly one other member
    if data.type == "direct" and len(data.member_ids) != 1:
        raise HTTPException(400, "Una conversación directa requiere exactamente un miembro")

    # Validate all member_ids exist
    member_uuids = [parse_uuid(mid, "member_id") for mid in data.member_ids]
    existing_users = (await db.execute(
        select(User.id).where(User.id.in_(member_uuids))
    )).scalars().all()
    if len(existing_users) != len(member_uuids):
        raise HTTPException(404, "Uno o más miembros no encontrados")

    # For direct: check if conversation already exists between these two users
    if data.type == "direct":
        other_id = member_uuids[0]
        existing_conv = (await db.execute(
            select(Conversation.id)
            .join(ConversationMember, ConversationMember.conversation_id == Conversation.id)
            .where(
                Conversation.type == "direct",
                Conversation.is_active == True,
                ConversationMember.user_id == user.id,
            )
        )).scalars().all()

        for conv_id in existing_conv:
            other_member = (await db.execute(
                select(ConversationMember).where(
                    ConversationMember.conversation_id == conv_id,
                    ConversationMember.user_id == other_id,
                )
            )).scalar_one_or_none()
            if other_member:
                return {
                    "id": str(conv_id),
                    "type": "direct",
                    "title": data.title,
                    "existing": True,
                }

    conv = Conversation(
        type=data.type,
        title=data.title,
        created_by=user.id,
    )
    db.add(conv)
    await db.flush()

    # Add creator as member
    db.add(ConversationMember(
        conversation_id=conv.id, user_id=user.id, role="admin",
    ))
    # Add other members
    for mid in member_uuids:
        if mid != user.id:
            db.add(ConversationMember(
                conversation_id=conv.id, user_id=mid, role="member",
            ))

    await db.commit()
    await db.refresh(conv)
    return {
        "id": str(conv.id),
        "type": conv.type,
        "title": conv.title,
        "created_at": conv.created_at.isoformat(),
    }


@router.get("/conversations")
async def list_conversations(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """List user's conversations with last message preview and unread count."""
    # Get conversation IDs where user is a member
    memberships = (await db.execute(
        select(ConversationMember)
        .where(ConversationMember.user_id == user.id)
    )).scalars().all()

    if not memberships:
        return []

    membership_map = {m.conversation_id: m for m in memberships}
    conv_ids = list(membership_map.keys())

    conversations = (await db.execute(
        select(Conversation)
        .where(Conversation.id.in_(conv_ids), Conversation.is_active == True)
        .order_by(desc(Conversation.updated_at))
    )).scalars().all()

    results = []
    for conv in conversations:
        member = membership_map[conv.id]

        # Last message
        last_msg = (await db.execute(
            select(Message)
            .where(Message.conversation_id == conv.id)
            .order_by(desc(Message.created_at))
            .limit(1)
        )).scalar_one_or_none()

        # Unread count: messages created after last_read_at
        unread_count = 0
        if member.last_read_at:
            unread_count = (await db.execute(
                select(func.count(Message.id)).where(
                    Message.conversation_id == conv.id,
                    Message.created_at > member.last_read_at,
                    Message.sender_id != user.id,
                )
            )).scalar() or 0
        else:
            # Never read: count all messages not from this user
            unread_count = (await db.execute(
                select(func.count(Message.id)).where(
                    Message.conversation_id == conv.id,
                    Message.sender_id != user.id,
                )
            )).scalar() or 0

        # For direct conversations, get other member name
        title = conv.title
        if conv.type == "direct" and not title:
            other_member = (await db.execute(
                select(User.first_name, User.last_name)
                .join(ConversationMember, ConversationMember.user_id == User.id)
                .where(
                    ConversationMember.conversation_id == conv.id,
                    ConversationMember.user_id != user.id,
                )
            )).first()
            if other_member:
                title = f"{other_member[0]} {other_member[1]}"

        results.append({
            "id": str(conv.id),
            "type": conv.type,
            "title": title,
            "unread_count": unread_count,
            "last_message": {
                "content": last_msg.content[:100] if last_msg else None,
                "sender_id": str(last_msg.sender_id) if last_msg else None,
                "created_at": last_msg.created_at.isoformat() if last_msg else None,
            } if last_msg else None,
            "updated_at": conv.updated_at.isoformat(),
        })

    return results


@router.get("/conversations/{conv_id}/messages")
async def get_conversation_messages(
    conv_id: str,
    limit: int = Query(50, ge=1, le=100),
    before_id: str | None = None,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Get paginated messages for a conversation."""
    conv_uuid = parse_uuid(conv_id, "conversation_id")

    # Verify user is a member
    member = (await db.execute(
        select(ConversationMember).where(
            ConversationMember.conversation_id == conv_uuid,
            ConversationMember.user_id == user.id,
        )
    )).scalar_one_or_none()
    if not member:
        raise HTTPException(403, "No eres miembro de esta conversación")

    # Build query
    q = select(Message, User.first_name, User.last_name).outerjoin(
        User, User.id == Message.sender_id
    ).where(Message.conversation_id == conv_uuid)

    if before_id:
        before_uuid = parse_uuid(before_id, "before_id")
        ref_msg = (await db.execute(
            select(Message.created_at).where(Message.id == before_uuid)
        )).scalar_one_or_none()
        if ref_msg:
            q = q.where(Message.created_at < ref_msg)

    q = q.order_by(desc(Message.created_at)).limit(limit)
    rows = (await db.execute(q)).all()

    # Update last_read_at
    member.last_read_at = datetime.now(timezone.utc)
    await db.commit()

    return [{
        "id": str(msg.id),
        "sender_id": str(msg.sender_id),
        "sender_name": f"{fname} {lname}" if fname else None,
        "content": msg.content,
        "message_type": msg.message_type,
        "file_url": msg.file_url,
        "is_edited": msg.is_edited,
        "created_at": msg.created_at.isoformat(),
    } for msg, fname, lname in reversed(rows)]


@router.post("/conversations/{conv_id}/messages")
async def send_message(
    conv_id: str,
    data: SendMessageRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Send a message in a conversation."""
    conv_uuid = parse_uuid(conv_id, "conversation_id")

    if not data.content.strip():
        raise HTTPException(400, "El mensaje no puede estar vacío")

    # Verify user is a member
    member = (await db.execute(
        select(ConversationMember).where(
            ConversationMember.conversation_id == conv_uuid,
            ConversationMember.user_id == user.id,
        )
    )).scalar_one_or_none()
    if not member:
        raise HTTPException(403, "No eres miembro de esta conversación")

    # Verify conversation exists and is active
    conv = (await db.execute(
        select(Conversation).where(Conversation.id == conv_uuid, Conversation.is_active == True)
    )).scalar_one_or_none()
    if not conv:
        raise HTTPException(404, "Conversación no encontrada")

    msg = Message(
        conversation_id=conv_uuid,
        sender_id=user.id,
        content=data.content,
        message_type=data.message_type,
        file_url=data.file_url,
    )
    db.add(msg)

    # Update conversation updated_at
    conv.updated_at = datetime.now(timezone.utc)

    # Update sender's last_read_at
    member.last_read_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(msg)

    return {
        "id": str(msg.id),
        "sender_id": str(msg.sender_id),
        "content": msg.content,
        "message_type": msg.message_type,
        "file_url": msg.file_url,
        "created_at": msg.created_at.isoformat(),
    }


# ─── Announcements ───

@router.post("/announcements")
async def create_announcement(
    data: CreateAnnouncementRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_profesor),
):
    """Create an announcement for a section."""
    section_id = parse_uuid(data.section_id, "section_id")

    # Verify profesor owns the section
    section = (await db.execute(
        select(Section).join(Subject, Subject.id == Section.subject_id)
        .where(Section.id == section_id, Subject.profesor_id == user.id)
    )).scalar_one_or_none()
    if not section:
        raise HTTPException(404, "Sección no encontrada o no te pertenece")

    announcement = Announcement(
        profesor_id=user.id,
        section_id=section_id,
        title=data.title,
        content=data.content,
        is_pinned=data.is_pinned,
    )
    db.add(announcement)
    await db.commit()
    await db.refresh(announcement)

    return {
        "id": str(announcement.id),
        "title": announcement.title,
        "content": announcement.content,
        "is_pinned": announcement.is_pinned,
        "created_at": announcement.created_at.isoformat(),
    }


@router.get("/announcements")
async def list_announcements(
    section_id: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """List announcements. If section_id is provided, filter by that section.
    Otherwise return announcements from all sections the user has access to."""

    if section_id:
        sid = parse_uuid(section_id, "section_id")
        section_ids = [sid]

        # Verify user has access
        if user.role in ("profesor", "superadmin"):
            section = (await db.execute(
                select(Section).join(Subject, Subject.id == Section.subject_id)
                .where(Section.id == sid, Subject.profesor_id == user.id)
            )).scalar_one_or_none()
        else:
            section = (await db.execute(
                select(Section).join(SectionStudent, SectionStudent.section_id == Section.id)
                .where(Section.id == sid, SectionStudent.student_id == user.id)
            )).scalar_one_or_none()

        if not section:
            raise HTTPException(403, "No tienes acceso a esta sección")
    else:
        # Get all sections the user has access to
        if user.role in ("profesor", "superadmin"):
            rows = (await db.execute(
                select(Section.id)
                .join(Subject, Subject.id == Section.subject_id)
                .where(Subject.profesor_id == user.id)
            )).scalars().all()
        else:
            rows = (await db.execute(
                select(Section.id)
                .join(SectionStudent, SectionStudent.section_id == Section.id)
                .where(SectionStudent.student_id == user.id)
            )).scalars().all()

        section_ids = list(rows)
        if not section_ids:
            return []

    announcements = (await db.execute(
        select(Announcement, User.first_name, User.last_name)
        .join(User, User.id == Announcement.profesor_id)
        .where(Announcement.section_id.in_(section_ids))
        .order_by(desc(Announcement.is_pinned), desc(Announcement.created_at))
    )).all()

    return [{
        "id": str(a.id),
        "title": a.title,
        "content": a.content,
        "is_pinned": a.is_pinned,
        "section_id": str(a.section_id),
        "profesor_name": f"{fname} {lname}",
        "created_at": a.created_at.isoformat(),
        "updated_at": a.updated_at.isoformat(),
    } for a, fname, lname in announcements]


@router.put("/announcements/{announcement_id}")
async def update_announcement(
    announcement_id: str,
    data: UpdateAnnouncementRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_profesor),
):
    """Update an announcement (owner only)."""
    ann = (await db.execute(
        select(Announcement).where(
            Announcement.id == parse_uuid(announcement_id, "announcement_id"),
            Announcement.profesor_id == user.id,
        )
    )).scalar_one_or_none()
    if not ann:
        raise HTTPException(404, "Anuncio no encontrado")

    if data.title is not None:
        ann.title = data.title
    if data.content is not None:
        ann.content = data.content
    if data.is_pinned is not None:
        ann.is_pinned = data.is_pinned

    await db.commit()
    return {"ok": True}


@router.delete("/announcements/{announcement_id}")
async def delete_announcement(
    announcement_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_profesor),
):
    """Delete an announcement."""
    ann = (await db.execute(
        select(Announcement).where(
            Announcement.id == parse_uuid(announcement_id, "announcement_id"),
            Announcement.profesor_id == user.id,
        )
    )).scalar_one_or_none()
    if not ann:
        raise HTTPException(404, "Anuncio no encontrado")

    await db.delete(ann)
    await db.commit()
    return {"ok": True}


# ─── Forums ───

@router.post("/forums")
async def create_forum(
    data: CreateForumRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_profesor),
):
    """Create a forum for a section."""
    section_id = parse_uuid(data.section_id, "section_id")

    section = (await db.execute(
        select(Section).join(Subject, Subject.id == Section.subject_id)
        .where(Section.id == section_id, Subject.profesor_id == user.id)
    )).scalar_one_or_none()
    if not section:
        raise HTTPException(404, "Sección no encontrada o no te pertenece")

    forum = Forum(
        section_id=section_id,
        title=data.title,
        description=data.description,
        created_by=user.id,
    )
    db.add(forum)
    await db.commit()
    await db.refresh(forum)

    return {
        "id": str(forum.id),
        "title": forum.title,
        "description": forum.description,
        "is_locked": forum.is_locked,
        "created_at": forum.created_at.isoformat(),
    }


@router.get("/forums")
async def list_forums(
    section_id: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """List forums. If section_id is provided, filter by that section.
    Otherwise return forums from all sections the user has access to."""

    if section_id:
        sid = parse_uuid(section_id, "section_id")
        section_ids = [sid]

        # Verify access
        if user.role in ("profesor", "superadmin"):
            section = (await db.execute(
                select(Section).join(Subject, Subject.id == Section.subject_id)
                .where(Section.id == sid, Subject.profesor_id == user.id)
            )).scalar_one_or_none()
        else:
            section = (await db.execute(
                select(Section).join(SectionStudent, SectionStudent.section_id == Section.id)
                .where(Section.id == sid, SectionStudent.student_id == user.id)
            )).scalar_one_or_none()

        if not section:
            raise HTTPException(403, "No tienes acceso a esta sección")
    else:
        # Get all sections the user has access to
        if user.role in ("profesor", "superadmin"):
            rows = (await db.execute(
                select(Section.id)
                .join(Subject, Subject.id == Section.subject_id)
                .where(Subject.profesor_id == user.id)
            )).scalars().all()
        else:
            rows = (await db.execute(
                select(Section.id)
                .join(SectionStudent, SectionStudent.section_id == Section.id)
                .where(SectionStudent.student_id == user.id)
            )).scalars().all()

        section_ids = list(rows)
        if not section_ids:
            return []

    post_count_sub = (
        select(func.count(ForumPost.id))
        .where(ForumPost.forum_id == Forum.id)
        .correlate(Forum)
        .scalar_subquery()
    )

    forums = (await db.execute(
        select(Forum, post_count_sub.label("post_count"), User.first_name, User.last_name)
        .join(User, User.id == Forum.created_by)
        .where(Forum.section_id.in_(section_ids))
        .order_by(desc(Forum.created_at))
    )).all()

    return [{
        "id": str(f.id),
        "title": f.title,
        "description": f.description,
        "is_locked": f.is_locked,
        "section_id": str(f.section_id),
        "created_by_name": f"{fname} {lname}",
        "post_count": pc,
        "created_at": f.created_at.isoformat(),
    } for f, pc, fname, lname in forums]


@router.get("/forums/{forum_id}/posts")
async def get_forum_posts(
    forum_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Get forum posts in a threaded structure."""
    fid = parse_uuid(forum_id, "forum_id")

    forum = (await db.execute(select(Forum).where(Forum.id == fid))).scalar_one_or_none()
    if not forum:
        raise HTTPException(404, "Foro no encontrado")

    # Verify access via section
    if user.role in ("profesor", "superadmin"):
        section = (await db.execute(
            select(Section).join(Subject, Subject.id == Section.subject_id)
            .where(Section.id == forum.section_id, Subject.profesor_id == user.id)
        )).scalar_one_or_none()
    else:
        section = (await db.execute(
            select(Section).join(SectionStudent, SectionStudent.section_id == Section.id)
            .where(Section.id == forum.section_id, SectionStudent.student_id == user.id)
        )).scalar_one_or_none()

    if not section:
        raise HTTPException(403, "No tienes acceso a este foro")

    # Load all posts
    posts = (await db.execute(
        select(ForumPost, User.first_name, User.last_name)
        .join(User, User.id == ForumPost.author_id)
        .where(ForumPost.forum_id == fid)
        .order_by(ForumPost.created_at)
    )).all()

    # Build tree: collect all posts, then nest children under parents
    post_map = {}
    root_posts = []
    for post, fname, lname in posts:
        node = {
            "id": str(post.id),
            "author_name": f"{fname} {lname}",
            "author_id": str(post.author_id),
            "content": post.content,
            "is_pinned": post.is_pinned,
            "upvotes": post.upvotes,
            "parent_id": str(post.parent_id) if post.parent_id else None,
            "created_at": post.created_at.isoformat(),
            "replies": [],
        }
        post_map[str(post.id)] = node

    for post, _, _ in posts:
        node = post_map[str(post.id)]
        if post.parent_id and str(post.parent_id) in post_map:
            post_map[str(post.parent_id)]["replies"].append(node)
        else:
            root_posts.append(node)

    return root_posts


@router.post("/forums/{forum_id}/posts")
async def create_forum_post(
    forum_id: str,
    data: CreateForumPostRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Create a post or reply in a forum."""
    fid = parse_uuid(forum_id, "forum_id")

    forum = (await db.execute(select(Forum).where(Forum.id == fid))).scalar_one_or_none()
    if not forum:
        raise HTTPException(404, "Foro no encontrado")

    if forum.is_locked:
        raise HTTPException(400, "Este foro está bloqueado")

    if not data.content.strip():
        raise HTTPException(400, "El contenido no puede estar vacío")

    # Verify access via section
    if user.role in ("profesor", "superadmin"):
        section = (await db.execute(
            select(Section).join(Subject, Subject.id == Section.subject_id)
            .where(Section.id == forum.section_id, Subject.profesor_id == user.id)
        )).scalar_one_or_none()
    else:
        section = (await db.execute(
            select(Section).join(SectionStudent, SectionStudent.section_id == Section.id)
            .where(Section.id == forum.section_id, SectionStudent.student_id == user.id)
        )).scalar_one_or_none()

    if not section:
        raise HTTPException(403, "No tienes acceso a este foro")

    parent_uuid = None
    if data.parent_id:
        parent_uuid = parse_uuid(data.parent_id, "parent_id")
        parent = (await db.execute(
            select(ForumPost).where(ForumPost.id == parent_uuid, ForumPost.forum_id == fid)
        )).scalar_one_or_none()
        if not parent:
            raise HTTPException(404, "Post padre no encontrado")

    post = ForumPost(
        forum_id=fid,
        author_id=user.id,
        parent_id=parent_uuid,
        content=data.content,
    )
    db.add(post)
    await db.commit()
    await db.refresh(post)

    return {
        "id": str(post.id),
        "content": post.content,
        "parent_id": str(post.parent_id) if post.parent_id else None,
        "created_at": post.created_at.isoformat(),
    }


@router.post("/forums/posts/{post_id}/upvote")
async def upvote_post(
    post_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Increment upvotes on a forum post."""
    post = (await db.execute(
        select(ForumPost).where(ForumPost.id == parse_uuid(post_id, "post_id"))
    )).scalar_one_or_none()
    if not post:
        raise HTTPException(404, "Post no encontrado")

    post.upvotes = (post.upvotes or 0) + 1
    await db.commit()

    return {"upvotes": post.upvotes}
