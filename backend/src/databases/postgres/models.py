import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    ForeignKey,
    String,
    Boolean,
    DateTime,
    Table,
    Integer,
    Text,
    UUID,
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, Mapped

Base = declarative_base()

user_save_anime = Table(
    "user_save_anime",
    Base.metadata,
    Column(
        "user_id",
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE", onupdate="CASCADE"),
        primary_key=True,
    ),
    Column(
        "anime_id",
        String,
        ForeignKey("animes.id", ondelete="CASCADE", onupdate="CASCADE"),
        primary_key=True,
    ),
)


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(64), nullable=False, unique=True)
    password = Column(String(60), nullable=False)
    avatar = Column(String(255))
    is_admin = Column(Boolean, nullable=False, default=False)
    is_active = Column(Boolean, nullable=False, default=False)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    animes_saved: Mapped[list["Anime"]] = relationship(
        secondary=user_save_anime, back_populates="users_saving"
    )


class Anime(Base):
    __tablename__ = "animes"

    id = Column(String, primary_key=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    img = Column(Text, nullable=False)
    is_finished = Column(Boolean, nullable=False, default=True)
    week_day = Column(String(32), nullable=True)
    last_peek = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    users_saving: Mapped[list["User"]] = relationship(
        secondary=user_save_anime, back_populates="animes_saved"
    )
    all_episodes: Mapped[list["Episode"]] = relationship(
        back_populates="anime", cascade="all, delete"
    )


class Episode(Base):
    __tablename__ = "episodes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    anime_id = Column(
        String,
        ForeignKey("animes.id", ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False,
    )
    episode_id = Column(Integer, nullable=False)
    name = Column(String(255), nullable=False)
    link = Column(String(255), nullable=False)

    anime: Mapped["Anime"] = relationship(back_populates="all_episodes")
