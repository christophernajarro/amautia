"""add all new features

Revision ID: b1a2c3d4e5f6
Revises: 8c6c523e48b1
Create Date: 2026-03-17 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB


# revision identifiers, used by Alembic.
revision: str = 'b1a2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '8c6c523e48b1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── ALTER existing users table ──────────────────────────────────────
    op.add_column('users', sa.Column('language', sa.String(10), server_default='es'))

    # ── 1. gamification_profiles ────────────────────────────────────────
    op.create_table('gamification_profiles',
        sa.Column('id', UUID(), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', UUID(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('total_points', sa.Integer(), server_default='0'),
        sa.Column('current_streak', sa.Integer(), server_default='0'),
        sa.Column('longest_streak', sa.Integer(), server_default='0'),
        sa.Column('level', sa.Integer(), server_default='1'),
        sa.Column('xp', sa.Integer(), server_default='0'),
        sa.Column('last_activity_date', sa.Date(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id'),
    )
    op.create_index('ix_gamification_profiles_user_id', 'gamification_profiles', ['user_id'])

    # ── 2. badges ───────────────────────────────────────────────────────
    op.create_table('badges',
        sa.Column('id', UUID(), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('icon', sa.String(100), nullable=True),
        sa.Column('category', sa.String(50), nullable=True),
        sa.Column('requirement_type', sa.String(50), nullable=True),
        sa.Column('requirement_value', sa.Integer(), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
    )

    # ── 3. user_badges ──────────────────────────────────────────────────
    op.create_table('user_badges',
        sa.Column('id', UUID(), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', UUID(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('badge_id', UUID(), sa.ForeignKey('badges.id', ondelete='CASCADE'), nullable=False),
        sa.Column('earned_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
    )

    # ── 4. point_transactions ───────────────────────────────────────────
    op.create_table('point_transactions',
        sa.Column('id', UUID(), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', UUID(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('points', sa.Integer(), nullable=False),
        sa.Column('action', sa.String(50), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_point_transactions_user_id', 'point_transactions', ['user_id'])

    # ── 5. leaderboard_entries ──────────────────────────────────────────
    op.create_table('leaderboard_entries',
        sa.Column('id', UUID(), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', UUID(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('section_id', UUID(), sa.ForeignKey('sections.id'), nullable=True),
        sa.Column('period', sa.String(20), nullable=False),
        sa.Column('points', sa.Integer(), server_default='0'),
        sa.Column('rank', sa.Integer(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_leaderboard_entries_period', 'leaderboard_entries', ['period'])

    # ── 6. live_quizzes ─────────────────────────────────────────────────
    op.create_table('live_quizzes',
        sa.Column('id', UUID(), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('exam_id', UUID(), sa.ForeignKey('exams.id'), nullable=True),
        sa.Column('profesor_id', UUID(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('section_id', UUID(), sa.ForeignKey('sections.id'), nullable=False),
        sa.Column('title', sa.String(300), nullable=False),
        sa.Column('status', sa.String(20), server_default='waiting'),
        sa.Column('mode', sa.String(20), server_default='individual'),
        sa.Column('time_per_question', sa.Integer(), nullable=True),
        sa.Column('show_leaderboard', sa.Boolean(), server_default='true'),
        sa.Column('current_question_index', sa.Integer(), server_default='0'),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('finished_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('pin_code', sa.String(6), nullable=False),
        sa.Column('settings', JSONB(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('pin_code'),
    )
    op.create_index('ix_live_quizzes_pin_code', 'live_quizzes', ['pin_code'])
    op.create_index('ix_live_quizzes_status', 'live_quizzes', ['status'])

    # ── 7. live_quiz_participants ────────────────────────────────────────
    op.create_table('live_quiz_participants',
        sa.Column('id', UUID(), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('quiz_id', UUID(), sa.ForeignKey('live_quizzes.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', UUID(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('team_name', sa.String(100), nullable=True),
        sa.Column('score', sa.Integer(), server_default='0'),
        sa.Column('correct_answers', sa.Integer(), server_default='0'),
        sa.Column('total_answers', sa.Integer(), server_default='0'),
        sa.Column('joined_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
    )

    # ── 8. live_quiz_responses ──────────────────────────────────────────
    op.create_table('live_quiz_responses',
        sa.Column('id', UUID(), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('quiz_id', UUID(), sa.ForeignKey('live_quizzes.id', ondelete='CASCADE'), nullable=False),
        sa.Column('participant_id', UUID(), sa.ForeignKey('live_quiz_participants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('question_index', sa.Integer(), nullable=False),
        sa.Column('answer', sa.Text(), nullable=True),
        sa.Column('is_correct', sa.Boolean(), nullable=True),
        sa.Column('points_earned', sa.Integer(), server_default='0'),
        sa.Column('response_time_ms', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
    )

    # ── 9. plagiarism_checks ────────────────────────────────────────────
    op.create_table('plagiarism_checks',
        sa.Column('id', UUID(), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('student_exam_id', UUID(), sa.ForeignKey('student_exams.id'), nullable=True),
        sa.Column('exam_id', UUID(), sa.ForeignKey('exams.id'), nullable=False),
        sa.Column('status', sa.String(20), server_default='pending'),
        sa.Column('similarity_score', sa.Numeric(5, 2), nullable=True),
        sa.Column('ai_generated_score', sa.Numeric(5, 2), nullable=True),
        sa.Column('checked_by', sa.String(20), server_default='system'),
        sa.Column('report', JSONB(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
    )

    # ── 10. plagiarism_matches ──────────────────────────────────────────
    op.create_table('plagiarism_matches',
        sa.Column('id', UUID(), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('check_id', UUID(), sa.ForeignKey('plagiarism_checks.id', ondelete='CASCADE'), nullable=False),
        sa.Column('matched_student_exam_id', UUID(), sa.ForeignKey('student_exams.id'), nullable=True),
        sa.Column('similarity_percentage', sa.Numeric(5, 2), nullable=False),
        sa.Column('matched_segments', JSONB(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
    )

    # ── 11. parent_student_links ────────────────────────────────────────
    op.create_table('parent_student_links',
        sa.Column('id', UUID(), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('parent_id', UUID(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('student_id', UUID(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('relationship', sa.String(30), nullable=False),
        sa.Column('status', sa.String(20), server_default='pending'),
        sa.Column('invited_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('confirmed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('parent_id', 'student_id'),
    )
    op.create_index('ix_parent_student_links_parent', 'parent_student_links', ['parent_id'])
    op.create_index('ix_parent_student_links_student', 'parent_student_links', ['student_id'])

    # ── 12. question_banks ──────────────────────────────────────────────
    op.create_table('question_banks',
        sa.Column('id', UUID(), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('profesor_id', UUID(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('subject_id', UUID(), sa.ForeignKey('subjects.id'), nullable=True),
        sa.Column('is_public', sa.Boolean(), server_default='false'),
        sa.Column('tags', JSONB(), nullable=True),
        sa.Column('total_questions', sa.Integer(), server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
    )

    # ── 13. question_bank_items ─────────────────────────────────────────
    op.create_table('question_bank_items',
        sa.Column('id', UUID(), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('bank_id', UUID(), sa.ForeignKey('question_banks.id', ondelete='CASCADE'), nullable=False),
        sa.Column('question_text', sa.Text(), nullable=False),
        sa.Column('question_type', sa.String(30), nullable=False),
        sa.Column('correct_answer', sa.Text(), nullable=True),
        sa.Column('options', JSONB(), nullable=True),
        sa.Column('points', sa.Numeric(5, 2), server_default='1'),
        sa.Column('difficulty', sa.String(20), nullable=True),
        sa.Column('tags', JSONB(), nullable=True),
        sa.Column('explanation', sa.Text(), nullable=True),
        sa.Column('has_image', sa.Boolean(), server_default='false'),
        sa.Column('image_url', sa.String(500), nullable=True),
        sa.Column('times_used', sa.Integer(), server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
    )

    # ── 14. conversations ───────────────────────────────────────────────
    op.create_table('conversations',
        sa.Column('id', UUID(), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('type', sa.String(20), nullable=False),
        sa.Column('title', sa.String(200), nullable=True),
        sa.Column('created_by', UUID(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
    )

    # ── 15. conversation_members ────────────────────────────────────────
    op.create_table('conversation_members',
        sa.Column('id', UUID(), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('conversation_id', UUID(), sa.ForeignKey('conversations.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', UUID(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('role', sa.String(20), server_default='member'),
        sa.Column('joined_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('last_read_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('conversation_id', 'user_id'),
    )

    # ── 16. messages ────────────────────────────────────────────────────
    op.create_table('messages',
        sa.Column('id', UUID(), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('conversation_id', UUID(), sa.ForeignKey('conversations.id', ondelete='CASCADE'), nullable=False),
        sa.Column('sender_id', UUID(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('message_type', sa.String(20), server_default='text'),
        sa.Column('file_url', sa.String(500), nullable=True),
        sa.Column('is_edited', sa.Boolean(), server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_messages_conversation', 'messages', ['conversation_id'])

    # ── 17. announcements ───────────────────────────────────────────────
    op.create_table('announcements',
        sa.Column('id', UUID(), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('profesor_id', UUID(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('section_id', UUID(), sa.ForeignKey('sections.id', ondelete='CASCADE'), nullable=False),
        sa.Column('title', sa.String(300), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('is_pinned', sa.Boolean(), server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
    )

    # ── 18. forums ──────────────────────────────────────────────────────
    op.create_table('forums',
        sa.Column('id', UUID(), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('section_id', UUID(), sa.ForeignKey('sections.id', ondelete='CASCADE'), nullable=False),
        sa.Column('title', sa.String(300), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_locked', sa.Boolean(), server_default='false'),
        sa.Column('created_by', UUID(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
    )

    # ── 19. forum_posts ─────────────────────────────────────────────────
    op.create_table('forum_posts',
        sa.Column('id', UUID(), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('forum_id', UUID(), sa.ForeignKey('forums.id', ondelete='CASCADE'), nullable=False),
        sa.Column('author_id', UUID(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('parent_id', UUID(), sa.ForeignKey('forum_posts.id'), nullable=True),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('is_pinned', sa.Boolean(), server_default='false'),
        sa.Column('upvotes', sa.Integer(), server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
    )

    # ── 20. flashcard_sets ──────────────────────────────────────────────
    op.create_table('flashcard_sets',
        sa.Column('id', UUID(), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('student_id', UUID(), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('profesor_id', UUID(), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('subject_id', UUID(), sa.ForeignKey('subjects.id'), nullable=True),
        sa.Column('title', sa.String(300), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_public', sa.Boolean(), server_default='false'),
        sa.Column('total_cards', sa.Integer(), server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
    )

    # ── 21. flashcards ──────────────────────────────────────────────────
    op.create_table('flashcards',
        sa.Column('id', UUID(), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('set_id', UUID(), sa.ForeignKey('flashcard_sets.id', ondelete='CASCADE'), nullable=False),
        sa.Column('front', sa.Text(), nullable=False),
        sa.Column('back', sa.Text(), nullable=False),
        sa.Column('has_image', sa.Boolean(), server_default='false'),
        sa.Column('image_url', sa.String(500), nullable=True),
        sa.Column('order_index', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
    )

    # ── 22. flashcard_reviews ───────────────────────────────────────────
    op.create_table('flashcard_reviews',
        sa.Column('id', UUID(), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', UUID(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('flashcard_id', UUID(), sa.ForeignKey('flashcards.id', ondelete='CASCADE'), nullable=False),
        sa.Column('ease_factor', sa.Numeric(4, 2), server_default='2.5'),
        sa.Column('interval_days', sa.Integer(), server_default='1'),
        sa.Column('repetitions', sa.Integer(), server_default='0'),
        sa.Column('quality', sa.Integer(), nullable=True),
        sa.Column('next_review', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_reviewed', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_flashcard_reviews_next', 'flashcard_reviews', ['next_review'])

    # ── 23. grading_periods ─────────────────────────────────────────────
    op.create_table('grading_periods',
        sa.Column('id', UUID(), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('section_id', UUID(), sa.ForeignKey('sections.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('weight', sa.Numeric(5, 2), server_default='1'),
        sa.Column('start_date', sa.Date(), nullable=True),
        sa.Column('end_date', sa.Date(), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true'),
        sa.Column('order_index', sa.Integer(), server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
    )

    # ── 24. gradebook_entries ───────────────────────────────────────────
    op.create_table('gradebook_entries',
        sa.Column('id', UUID(), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('student_id', UUID(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('section_id', UUID(), sa.ForeignKey('sections.id', ondelete='CASCADE'), nullable=False),
        sa.Column('grading_period_id', UUID(), sa.ForeignKey('grading_periods.id'), nullable=True),
        sa.Column('exam_id', UUID(), sa.ForeignKey('exams.id'), nullable=True),
        sa.Column('category', sa.String(50), server_default='exam'),
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('score', sa.Numeric(6, 2), nullable=False),
        sa.Column('max_score', sa.Numeric(6, 2), server_default='20'),
        sa.Column('weight', sa.Numeric(5, 2), server_default='1'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_gradebook_entries_student', 'gradebook_entries', ['student_id'])

    # ── 25. gradebook_configs ───────────────────────────────────────────
    op.create_table('gradebook_configs',
        sa.Column('id', UUID(), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('section_id', UUID(), sa.ForeignKey('sections.id', ondelete='CASCADE'), nullable=False),
        sa.Column('grading_scale', sa.String(20), server_default='0-20'),
        sa.Column('passing_score', sa.Numeric(5, 2), server_default='10.5'),
        sa.Column('categories_weights', JSONB(), nullable=True),
        sa.Column('round_to', sa.Integer(), server_default='1'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('section_id'),
    )

    # ── 26. peer_review_assignments ─────────────────────────────────────
    op.create_table('peer_review_assignments',
        sa.Column('id', UUID(), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('exam_id', UUID(), sa.ForeignKey('exams.id', ondelete='CASCADE'), nullable=False),
        sa.Column('status', sa.String(20), server_default='pending'),
        sa.Column('reviews_per_student', sa.Integer(), server_default='2'),
        sa.Column('is_anonymous', sa.Boolean(), server_default='true'),
        sa.Column('rubric', JSONB(), nullable=True),
        sa.Column('deadline', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
    )

    # ── 27. peer_reviews ────────────────────────────────────────────────
    op.create_table('peer_reviews',
        sa.Column('id', UUID(), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('assignment_id', UUID(), sa.ForeignKey('peer_review_assignments.id', ondelete='CASCADE'), nullable=False),
        sa.Column('reviewer_id', UUID(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('reviewee_exam_id', UUID(), sa.ForeignKey('student_exams.id', ondelete='CASCADE'), nullable=False),
        sa.Column('score', sa.Numeric(5, 2), nullable=True),
        sa.Column('feedback', sa.Text(), nullable=True),
        sa.Column('rubric_scores', JSONB(), nullable=True),
        sa.Column('status', sa.String(20), server_default='pending'),
        sa.Column('submitted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
    )

    # ── 28. certificate_templates ───────────────────────────────────────
    op.create_table('certificate_templates',
        sa.Column('id', UUID(), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('html_template', sa.Text(), nullable=False),
        sa.Column('css_styles', sa.Text(), nullable=True),
        sa.Column('variables', JSONB(), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true'),
        sa.Column('created_by', UUID(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
    )

    # ── 29. certificates ────────────────────────────────────────────────
    op.create_table('certificates',
        sa.Column('id', UUID(), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('template_id', UUID(), sa.ForeignKey('certificate_templates.id'), nullable=False),
        sa.Column('user_id', UUID(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('title', sa.String(300), nullable=False),
        sa.Column('data', JSONB(), nullable=True),
        sa.Column('pdf_url', sa.String(500), nullable=True),
        sa.Column('verification_code', sa.String(50), nullable=False),
        sa.Column('issued_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('verification_code'),
    )
    op.create_index('ix_certificates_verification', 'certificates', ['verification_code'])

    # ── 30. lti_registrations ───────────────────────────────────────────
    op.create_table('lti_registrations',
        sa.Column('id', UUID(), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('client_id', sa.String(200), nullable=False),
        sa.Column('platform_url', sa.String(500), nullable=False),
        sa.Column('auth_url', sa.String(500), nullable=False),
        sa.Column('token_url', sa.String(500), nullable=False),
        sa.Column('jwks_url', sa.String(500), nullable=False),
        sa.Column('deployment_id', sa.String(200), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('client_id'),
    )

    # ── 31. lti_contexts ────────────────────────────────────────────────
    op.create_table('lti_contexts',
        sa.Column('id', UUID(), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('registration_id', UUID(), sa.ForeignKey('lti_registrations.id', ondelete='CASCADE'), nullable=False),
        sa.Column('external_course_id', sa.String(200), nullable=False),
        sa.Column('section_id', UUID(), sa.ForeignKey('sections.id'), nullable=True),
        sa.Column('mapping', JSONB(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
    )


def downgrade() -> None:
    # Drop tables in reverse dependency order
    op.drop_table('lti_contexts')
    op.drop_table('lti_registrations')
    op.drop_table('certificates')
    op.drop_table('certificate_templates')
    op.drop_table('peer_reviews')
    op.drop_table('peer_review_assignments')
    op.drop_table('gradebook_configs')
    op.drop_table('gradebook_entries')
    op.drop_table('grading_periods')
    op.drop_table('flashcard_reviews')
    op.drop_table('flashcards')
    op.drop_table('flashcard_sets')
    op.drop_table('forum_posts')
    op.drop_table('forums')
    op.drop_table('announcements')
    op.drop_table('messages')
    op.drop_table('conversation_members')
    op.drop_table('conversations')
    op.drop_table('question_bank_items')
    op.drop_table('question_banks')
    op.drop_table('parent_student_links')
    op.drop_table('plagiarism_matches')
    op.drop_table('plagiarism_checks')
    op.drop_table('live_quiz_responses')
    op.drop_table('live_quiz_participants')
    op.drop_table('live_quizzes')
    op.drop_table('leaderboard_entries')
    op.drop_table('point_transactions')
    op.drop_table('user_badges')
    op.drop_table('badges')
    op.drop_table('gamification_profiles')

    # Revert ALTER TABLE
    op.drop_column('users', 'language')
