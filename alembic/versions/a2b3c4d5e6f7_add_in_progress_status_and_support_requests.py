from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'a2b3c4d5e6f7'
down_revision: Union[str, Sequence[str], None] = '4f38fbae2e8d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE tripstatus ADD VALUE IF NOT EXISTS 'in_progress'")

    op.create_table(
        'support_requests',
        sa.Column('id', sa.Integer(), nullable=False, autoincrement=True),
        sa.Column('email', sa.String(), nullable=False, index=True),
        sa.Column('subject', sa.String(length=200), nullable=False),
        sa.Column('message', sa.String(length=2000), nullable=False),
        sa.Column('category', sa.String(), nullable=False),
        sa.Column('status', sa.String(), nullable=False, server_default='new'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_support_requests_email', 'support_requests', ['email'])


def downgrade() -> None:
    op.drop_index('ix_support_requests_email', table_name='support_requests')
    op.drop_table('support_requests')
