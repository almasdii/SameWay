
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '4f38fbae2e8d'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('role', postgresql.ENUM('admin', 'driver', 'passenger', name='user_role'), server_default='passenger', nullable=False))


def downgrade() -> None:
    op.drop_column('users', 'role')
