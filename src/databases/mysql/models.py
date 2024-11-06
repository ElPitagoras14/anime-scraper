import uuid

from sqlalchemy import (
    Column,
    ForeignKey,
    String,
    Boolean,
    DateTime,
    Table,
    Integer,
    Text,
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, Mapped
from datetime import datetime, timezone

Base = declarative_base()

user_save_anime = Table(
    "user_save_anime",
    Base.metadata,
    Column(
        "user_id",
        ForeignKey("users.id", ondelete="CASCADE", onupdate="CASCADE"),
    ),
    Column(
        "anime_id",
        ForeignKey("animes.id", ondelete="CASCADE", onupdate="CASCADE"),
    ),
)


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=str(uuid.uuid4()))
    username = Column(String, nullable=False)
    password = Column(String, nullable=False)
    profile_img = Column(String, nullable=False)
    is_admin = Column(Boolean, nullable=False, default=False)
    is_active = Column(Boolean, nullable=False, default=False)
    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.now(timezone.utc),
    )
    updated_at = Column(
        DateTime,
        nullable=False,
        default=datetime.now(timezone.utc),
        onupdate=datetime.now(timezone.utc),
    )

    animes_saved: Mapped[list["Anime"]] = relationship(
        secondary=user_save_anime, back_populates="users_saving"
    )


class Anime(Base):
    __tablename__ = "animes"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    image_src = Column(String, nullable=False)
    is_finished = Column(Boolean, nullable=False, default=True)
    week_day = Column(String, nullable=True)
    last_peek = Column(
        DateTime,
        nullable=False,
        default=datetime.now(timezone.utc),
    )

    users_saving: Mapped[list["User"]] = relationship(
        secondary=user_save_anime, back_populates="animes_saved"
    )
    all_episodes: Mapped[list["Episode"]] = relationship(
        back_populates="anime"
    )


class Episode(Base):
    __tablename__ = "episodes"

    id = Column(Integer, primary_key=True)
    anime_id = Column(
        String,
        ForeignKey("animes.id", ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False,
    )
    episode_id = Column(Integer, nullable=False)
    name = Column(String, nullable=False)
    link = Column(String, nullable=False)

    anime: Mapped["Anime"] = relationship(back_populates="all_episodes")