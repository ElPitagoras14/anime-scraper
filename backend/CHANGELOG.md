# Changelog

## [2.2.0] - 2024-11-14

### Added

- Profile configuration feature
- More cacheable anime info
- Manage cache data
- Manage users

### Changed

- MySQL database to Postgres database
- `profile_img` to `img`

## [2.1.0] - 2024-11-12

### Added

- Save Anime Feature
- Keys for Anime and AnimeCard schema

## [2.0.1] - 2024-11-10

### Added

- Environment variables to manage some code variables.
- `profile_img` variable to jwt token.

### Changed

- Rewriting of `README.md`.

## [2.0.0] - 2024-11-07

### Added

- Integration of Playwright as the new scraping manager, replacing Selenium.
- Integration of Loguru as the new logger, replacing the built-in logger.
- New MySQL database for cache and user management, replacing Redis.
- Authentication and login for users.

### Changed

- Rewriting of key components of the code to adapt to Playwright and the new database.

## [1.0.0] - 2024-11-05

### Added

- Initial release of the project.
- Change log.
