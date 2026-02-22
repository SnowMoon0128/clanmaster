# Clan Manager (MVP)

## Run

1. `npm install`
2. Copy `.env.example` to `.env` and fill values.
3. `npm run db:init`
4. `npm run dev`
5. Open `http://localhost:4000`

## Notes

- 게임사 API 없이 수동 입력 기반으로 동작합니다.(아직은)
- 클랜장/클랜 관리자/사이트 관리자가 직접 플레이어 데이터를 관리합니다.
- 사이트 관리자는 전체 현황 조회, 유저 차단/해제를 수행합니다.

## API

- `POST /api/auth/register-owner`
- `POST /api/auth/register-manager`
- `POST /api/auth/login`
- `POST /api/auth/site-admin-login`
- `POST /api/players`
- `POST /api/players/:playerId/move`
- `GET /api/players/:playerId/history`
- `POST /api/blacklist`
- `GET /api/clans/:clanId/admins`
- `POST /api/clans/:clanId/admins`
- `GET /api/admin/overview`
- `POST /api/admin/block-user`
- `POST /api/admin/unblock-user`
