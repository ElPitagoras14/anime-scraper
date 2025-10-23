from .responses import Avatar, AvatarList, User, UserList, Statistics


def cast_user(user: dict) -> User:
    return User(
        id=user["id"],
        username=user["username"],
        avatar_url=user["avatar_url"],
        avatar_label=user["avatar_label"],
        role=user["role"],
        is_active=user["is_active"],
        created_at=user["created_at"],
        updated_at=user["updated_at"],
    )


def cast_users(users: list[dict], total: int) -> UserList:
    return UserList(
        items=[cast_user(user) for user in users],
        total=total,
    )


def cast_avatar(avatar: dict) -> Avatar:
    return Avatar(
        id=avatar["id"],
        label=avatar["label"],
        url=avatar["url"],
    )


def cast_avatars(avatars: list[dict], total: int) -> AvatarList:
    return AvatarList(
        items=[cast_avatar(avatar) for avatar in avatars],
        total=total,
    )


def cast_statistics(statistics: dict) -> Statistics:
    return Statistics(
        saved_animes=statistics["saved_animes"],
        downloaded_episodes=statistics["downloaded_episodes"],
        in_emission_animes=statistics["in_emission_animes"],
    )
