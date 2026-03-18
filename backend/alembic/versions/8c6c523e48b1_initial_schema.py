"""initial schema

Revision ID: 8c6c523e48b1
Revises:
Create Date: 2026-03-10 15:07:33.623179

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB


# revision identifiers, used by Alembic.
revision: str = '8c6c523e48b1'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- organizations ---
    op.create_table('organizations',
        sa.Column('id', UUID(), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('type', sa.String(20), nullable=True),
        sa.Column('logo_url', sa.String(500), nullable=True),
        sa.Column('owner_id', UUID(), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
    )

    # --- users ---
    op.create_table('users',
        sa.Column('id', UUID(), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('first_name', sa.String(100), nullable=False),
        sa.Column('last_name', sa.String(100), nullable=False),
        sa.Column('role', sa.String(20), nullable=False),
        sa.Column('phone', sa.String(20), nullable=True),
        sa.Column('avatar_url', sa.String(500), nullable=True),
        sa.Column('reset_token', sa.String(100), nullable=True),
        sa.Column('reset_token_expires', sa.DateTime(timezone=True), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true'),
        sa.Column('is_verified', sa.Boolean(), server_default='false'),
        sa.Column('organization_id', UUID(), sa.ForeignKey('organizations.id'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=True)
    op.create_index('ix_users_role', 'users', ['role'])

    # Add FK from organizations.owner_id -> users.id
    op.create_foreign_key('fk_organizations_owner', 'organizations', 'users', ['owner_id'], ['id'])

    # --- organization_members ---
    op.create_table('organization_members',
        sa.Column('id', UUID(), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('organization_id', UUID(), sa.ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', UUID(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('role', sa.String(20), server_default='member'),
        sa.Column('joined_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('organization_id', 'user_id'),
    )

    # --- subjects ---
    op.create_table('subjects',
        sa.Column('id', UUID(), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('color', sa.String(7), server_default='#3B82F6'),
        sa.Column('icon', sa.String(50), nullable=True),
        sa.Column('profesor_id', UUID(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
    )

    # --- sections ---
    op.create_table('sections',
        sa.Column('id', UUID(), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('subject_id', UUID(), sa.ForeignKey('subjects.id', ondelete='CASCADE'), nullable=False),
        sa.Column('class_code', sa.String(8), nullable=False),
        sa.Column('academic_period', sa.String(50), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_sections_class_code', 'sections', ['class_code'], unique=True)

    # --- section_students ---
    op.create_table('section_students',
        sa.Column('id', UUID(), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('section_id', UUID(), sa.ForeignKey('sections.id', ondelete='CASCADE'), nullable=False),
        sa.Column('student_id', UUID(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('joined_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('section_id', 'student_id'),
    )

    # --- plans ---
    op.create_table('plans',
        sa.Column('id', UUID(), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('slug', sa.String(50), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('price_monthly', sa.Numeric(8, 2), nullable=False),
        sa.Column('max_corrections_month', sa.Integer(), nullable=True),
        sa.Column('max_generations_month', sa.Integer(), nullable=True),
        sa.Column('max_students', sa.Integer(), nullable=True),
        sa.Column('max_subjects', sa.Integer(), nullable=True),
        sa.Column('has_tutor', sa.Boolean(), server_default='false'),
        sa.Column('tutor_level', sa.String(20), nullable=True),
        sa.Column('has_whatsapp_notifications', sa.Boolean(), server_default='false'),
        sa.Column('has_export', sa.Boolean(), server_default='true'),
        sa.Column('has_rubrics', sa.Boolean(), server_default='false'),
        sa.Column('has_analytics', sa.Boolean(), server_default='false'),
        sa.Column('is_academy', sa.Boolean(), server_default='false'),
        sa.Column('max_professors', sa.Integer(), server_default='1'),
        sa.Column('is_active', sa.Boolean(), server_default='true'),
        sa.Column('display_order', sa.Integer(), server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_plans_slug', 'plans', ['slug'], unique=True)

    # --- subscriptions ---
    op.create_table('subscriptions',
        sa.Column('id', UUID(), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', UUID(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('plan_id', UUID(), sa.ForeignKey('plans.id'), nullable=False),
        sa.Column('status', sa.String(20), server_default='active'),
        sa.Column('starts_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('corrections_used', sa.Integer(), server_default='0'),
        sa.Column('generations_used', sa.Integer(), server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_subscriptions_status', 'subscriptions', ['status'])

    # --- payments ---
    op.create_table('payments',
        sa.Column('id', UUID(), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', UUID(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('plan_id', UUID(), sa.ForeignKey('plans.id'), nullable=False),
        sa.Column('subscription_id', UUID(), sa.ForeignKey('subscriptions.id'), nullable=True),
        sa.Column('amount', sa.Numeric(8, 2), nullable=False),
        sa.Column('currency', sa.String(3), server_default='PEN'),
        sa.Column('method', sa.String(20), server_default='yape'),
        sa.Column('receipt_url', sa.String(500), nullable=True),
        sa.Column('reference_code', sa.String(100), nullable=True),
        sa.Column('status', sa.String(20), server_default='pending'),
        sa.Column('reviewed_by', UUID(), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('reviewed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('rejection_reason', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_payments_status', 'payments', ['status'])

    # --- exams ---
    op.create_table('exams',
        sa.Column('id', UUID(), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('title', sa.String(300), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('section_id', UUID(), sa.ForeignKey('sections.id', ondelete='CASCADE'), nullable=False),
        sa.Column('profesor_id', UUID(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('reference_file_url', sa.String(500), nullable=True),
        sa.Column('reference_file_type', sa.String(20), nullable=True),
        sa.Column('answers_file_url', sa.String(500), nullable=True),
        sa.Column('answers_text', sa.Text(), nullable=True),
        sa.Column('total_points', sa.Numeric(6, 2), server_default='20'),
        sa.Column('grading_scale', sa.String(20), server_default='0-20'),
        sa.Column('status', sa.String(20), server_default='draft'),
        sa.Column('ai_provider', sa.String(50), nullable=True),
        sa.Column('ai_model', sa.String(100), nullable=True),
        sa.Column('extracted_content', JSONB(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_exams_status', 'exams', ['status'])

    # --- exam_questions ---
    op.create_table('exam_questions',
        sa.Column('id', UUID(), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('exam_id', UUID(), sa.ForeignKey('exams.id', ondelete='CASCADE'), nullable=False),
        sa.Column('question_number', sa.Integer(), nullable=False),
        sa.Column('question_text', sa.Text(), nullable=True),
        sa.Column('question_type', sa.String(30), nullable=False),
        sa.Column('correct_answer', sa.Text(), nullable=True),
        sa.Column('points', sa.Numeric(5, 2), nullable=False),
        sa.Column('has_image', sa.Boolean(), server_default='false'),
        sa.Column('image_url', sa.String(500), nullable=True),
        sa.Column('options', JSONB(), nullable=True),
        sa.Column('order_index', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
    )

    # --- rubric_criteria ---
    op.create_table('rubric_criteria',
        sa.Column('id', UUID(), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('question_id', UUID(), sa.ForeignKey('exam_questions.id', ondelete='CASCADE'), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('max_points', sa.Numeric(5, 2), nullable=False),
        sa.Column('levels', JSONB(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
    )

    # --- student_exams ---
    op.create_table('student_exams',
        sa.Column('id', UUID(), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('exam_id', UUID(), sa.ForeignKey('exams.id', ondelete='CASCADE'), nullable=False),
        sa.Column('student_id', UUID(), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('file_url', sa.String(500), nullable=False),
        sa.Column('file_type', sa.String(20), nullable=True),
        sa.Column('total_score', sa.Numeric(6, 2), nullable=True),
        sa.Column('percentage', sa.Numeric(5, 2), nullable=True),
        sa.Column('status', sa.String(20), server_default='pending'),
        sa.Column('general_feedback', sa.Text(), nullable=True),
        sa.Column('strengths', sa.Text(), nullable=True),
        sa.Column('areas_to_improve', sa.Text(), nullable=True),
        sa.Column('extracted_content', JSONB(), nullable=True),
        sa.Column('profesor_reviewed', sa.Boolean(), server_default='false'),
        sa.Column('profesor_notes', sa.Text(), nullable=True),
        sa.Column('adjusted_score', sa.Numeric(6, 2), nullable=True),
        sa.Column('corrected_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_student_exams_status', 'student_exams', ['status'])

    # --- student_answers ---
    op.create_table('student_answers',
        sa.Column('id', UUID(), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('student_exam_id', UUID(), sa.ForeignKey('student_exams.id', ondelete='CASCADE'), nullable=False),
        sa.Column('question_id', UUID(), sa.ForeignKey('exam_questions.id'), nullable=True),
        sa.Column('answer_text', sa.Text(), nullable=True),
        sa.Column('answer_image_url', sa.String(500), nullable=True),
        sa.Column('score', sa.Numeric(5, 2), nullable=True),
        sa.Column('max_score', sa.Numeric(5, 2), nullable=True),
        sa.Column('is_correct', sa.Boolean(), nullable=True),
        sa.Column('feedback', sa.Text(), nullable=True),
        sa.Column('suggestion', sa.Text(), nullable=True),
        sa.Column('rubric_scores', JSONB(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
    )

    # --- ai_providers ---
    op.create_table('ai_providers',
        sa.Column('id', UUID(), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('slug', sa.String(50), nullable=False),
        sa.Column('api_key_encrypted', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true'),
        sa.Column('config', JSONB(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_ai_providers_slug', 'ai_providers', ['slug'], unique=True)

    # --- ai_models ---
    op.create_table('ai_models',
        sa.Column('id', UUID(), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('provider_id', UUID(), sa.ForeignKey('ai_providers.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('model_id', sa.String(100), nullable=False),
        sa.Column('supports_vision', sa.Boolean(), server_default='false'),
        sa.Column('supports_text', sa.Boolean(), server_default='true'),
        sa.Column('supports_image_generation', sa.Boolean(), server_default='false'),
        sa.Column('max_tokens', sa.Integer(), nullable=True),
        sa.Column('is_default_correction', sa.Boolean(), server_default='false'),
        sa.Column('is_default_generation', sa.Boolean(), server_default='false'),
        sa.Column('is_default_tutor', sa.Boolean(), server_default='false'),
        sa.Column('is_default_vision', sa.Boolean(), server_default='false'),
        sa.Column('is_active', sa.Boolean(), server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
    )

    # --- notifications ---
    op.create_table('notifications',
        sa.Column('id', UUID(), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', UUID(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('type', sa.String(50), nullable=False),
        sa.Column('title', sa.String(300), nullable=False),
        sa.Column('message', sa.Text(), nullable=True),
        sa.Column('data', JSONB(), nullable=True),
        sa.Column('channel', sa.String(20), server_default='in_app'),
        sa.Column('is_read', sa.Boolean(), server_default='false'),
        sa.Column('read_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('sent_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
    )

    # --- generated_exams ---
    op.create_table('generated_exams',
        sa.Column('id', UUID(), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('profesor_id', UUID(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('subject_id', UUID(), sa.ForeignKey('subjects.id'), nullable=True),
        sa.Column('title', sa.String(300), nullable=True),
        sa.Column('source_type', sa.String(30), nullable=True),
        sa.Column('source_files', JSONB(), nullable=True),
        sa.Column('source_text', sa.Text(), nullable=True),
        sa.Column('difficulty', sa.String(20), nullable=True),
        sa.Column('num_questions', sa.Integer(), nullable=True),
        sa.Column('question_types', JSONB(), nullable=True),
        sa.Column('include_images', sa.Boolean(), server_default='false'),
        sa.Column('education_level', sa.String(50), nullable=True),
        sa.Column('generated_content', JSONB(), nullable=True),
        sa.Column('answer_key', JSONB(), nullable=True),
        sa.Column('pdf_url', sa.String(500), nullable=True),
        sa.Column('pdf_with_answers_url', sa.String(500), nullable=True),
        sa.Column('word_url', sa.String(500), nullable=True),
        sa.Column('status', sa.String(20), server_default='generating'),
        sa.Column('ai_provider', sa.String(50), nullable=True),
        sa.Column('ai_model', sa.String(100), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
    )

    # --- generated_questions ---
    op.create_table('generated_questions',
        sa.Column('id', UUID(), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('generated_exam_id', UUID(), sa.ForeignKey('generated_exams.id', ondelete='CASCADE'), nullable=False),
        sa.Column('question_number', sa.Integer(), nullable=True),
        sa.Column('question_text', sa.Text(), nullable=False),
        sa.Column('question_type', sa.String(30), nullable=True),
        sa.Column('correct_answer', sa.Text(), nullable=True),
        sa.Column('explanation', sa.Text(), nullable=True),
        sa.Column('points', sa.Numeric(5, 2), nullable=True),
        sa.Column('has_image', sa.Boolean(), server_default='false'),
        sa.Column('image_url', sa.String(500), nullable=True),
        sa.Column('options', JSONB(), nullable=True),
        sa.Column('order_index', sa.Integer(), nullable=True),
        sa.Column('is_edited', sa.Boolean(), server_default='false'),
        sa.Column('original_text', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
    )

    # --- tutor_chats ---
    op.create_table('tutor_chats',
        sa.Column('id', UUID(), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('student_id', UUID(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('subject_id', UUID(), sa.ForeignKey('subjects.id'), nullable=True),
        sa.Column('title', sa.String(300), nullable=True),
        sa.Column('context', JSONB(), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
    )

    # --- tutor_messages ---
    op.create_table('tutor_messages',
        sa.Column('id', UUID(), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('chat_id', UUID(), sa.ForeignKey('tutor_chats.id', ondelete='CASCADE'), nullable=False),
        sa.Column('role', sa.String(10), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
    )

    # --- study_plans ---
    op.create_table('study_plans',
        sa.Column('id', UUID(), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('student_id', UUID(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('subject_id', UUID(), sa.ForeignKey('subjects.id'), nullable=True),
        sa.Column('title', sa.String(300), nullable=True),
        sa.Column('generated_plan', JSONB(), nullable=True),
        sa.Column('status', sa.String(20), server_default='active'),
        sa.Column('progress_percentage', sa.Numeric(5, 2), server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
    )

    # --- study_plan_topics ---
    op.create_table('study_plan_topics',
        sa.Column('id', UUID(), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('study_plan_id', UUID(), sa.ForeignKey('study_plans.id', ondelete='CASCADE'), nullable=False),
        sa.Column('topic_name', sa.String(300), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('priority', sa.String(10), nullable=True),
        sa.Column('status', sa.String(20), server_default='pending'),
        sa.Column('resources', JSONB(), nullable=True),
        sa.Column('exercises_completed', sa.Integer(), server_default='0'),
        sa.Column('exercises_total', sa.Integer(), server_default='0'),
        sa.Column('order_index', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
    )

    # --- practice_exercises ---
    op.create_table('practice_exercises',
        sa.Column('id', UUID(), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('student_id', UUID(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('topic_id', UUID(), sa.ForeignKey('study_plan_topics.id'), nullable=True),
        sa.Column('question_text', sa.Text(), nullable=False),
        sa.Column('question_type', sa.String(30), nullable=True),
        sa.Column('correct_answer', sa.Text(), nullable=True),
        sa.Column('student_answer', sa.Text(), nullable=True),
        sa.Column('is_correct', sa.Boolean(), nullable=True),
        sa.Column('score', sa.Numeric(5, 2), nullable=True),
        sa.Column('feedback', sa.Text(), nullable=True),
        sa.Column('difficulty', sa.String(20), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
    )

    # --- system_config ---
    op.create_table('system_config',
        sa.Column('key', sa.String(100), nullable=False),
        sa.Column('value', JSONB(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('key'),
    )

    # --- activity_logs ---
    op.create_table('activity_logs',
        sa.Column('id', UUID(), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', UUID(), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('action', sa.String(100), nullable=False),
        sa.Column('entity_type', sa.String(50), nullable=True),
        sa.Column('entity_id', UUID(), nullable=True),
        sa.Column('details', JSONB(), nullable=True),
        sa.Column('ip_address', sa.String(45), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
    )


def downgrade() -> None:
    op.drop_table('activity_logs')
    op.drop_table('system_config')
    op.drop_table('practice_exercises')
    op.drop_table('study_plan_topics')
    op.drop_table('study_plans')
    op.drop_table('tutor_messages')
    op.drop_table('tutor_chats')
    op.drop_table('generated_questions')
    op.drop_table('generated_exams')
    op.drop_table('notifications')
    op.drop_table('ai_models')
    op.drop_table('ai_providers')
    op.drop_table('student_answers')
    op.drop_table('student_exams')
    op.drop_table('rubric_criteria')
    op.drop_table('exam_questions')
    op.drop_table('exams')
    op.drop_table('payments')
    op.drop_table('subscriptions')
    op.drop_table('plans')
    op.drop_table('section_students')
    op.drop_table('sections')
    op.drop_table('subjects')
    op.drop_table('organization_members')
    op.drop_foreign_key('fk_organizations_owner', 'organizations')
    op.drop_table('users')
    op.drop_table('organizations')
