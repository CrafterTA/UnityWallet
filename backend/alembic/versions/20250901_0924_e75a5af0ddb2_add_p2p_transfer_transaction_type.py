"""add p2p transfer transaction type

Revision ID: e75a5af0ddb2
Revises: b6bf8b0049d7
Create Date: 2025-09-01 09:24:17.607136+00:00

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e75a5af0ddb2'
down_revision = 'b6bf8b0049d7'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add P2P_TRANSFER to the transactiontype enum
    op.execute("ALTER TYPE transactiontype ADD VALUE 'p2p_transfer'")


def downgrade() -> None:
    # Note: PostgreSQL doesn't allow removing enum values directly
    # This would require recreating the enum and updating all references
    pass