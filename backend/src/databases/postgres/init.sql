CREATE TABLE users (
    id UUID PRIMARY KEY,
    username VARCHAR(64) UNIQUE NOT NULL,
    password CHAR(60) NOT NULL,
    avatar VARCHAR(255),
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE animes (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    img TEXT NOT NULL,
    is_finished BOOLEAN NOT NULL DEFAULT TRUE,
    week_day VARCHAR(32),
    last_peek TIMESTAMP NOT NULL
);

CREATE TABLE episodes (
    id SERIAL PRIMARY KEY,
    anime_id VARCHAR(255) NOT NULL,
    episode_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    link VARCHAR(255) NOT NULL,
    CONSTRAINT fk_episode_anime FOREIGN KEY (anime_id) REFERENCES animes (id) ON DELETE CASCADE
);

CREATE TABLE user_save_anime (
    user_id UUID,
    anime_id VARCHAR(255),
    PRIMARY KEY (user_id, anime_id),
    CONSTRAINT fk_user_save FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_anime_save FOREIGN KEY (anime_id) REFERENCES animes (id) ON DELETE CASCADE
);
