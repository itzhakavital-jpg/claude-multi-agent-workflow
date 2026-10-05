---
name: api-conventions
description: Conventions for adding or changing routes in a small Express API that uses one router per resource and an in-memory store. Use when creating a new endpoint or resource, changing request validation or error responses, or checking that a route follows the project rules (status codes, error shape, data access through the store).
---

# Express API conventions

Use this checklist whenever you add or change a route. The project's own `CLAUDE.md` wins if it disagrees with anything here.

## Layout

- One file per resource in `routes/`, each exporting an `express.Router()`.
- Mount it in `server.js` under its base path: `app.use('/things', thingsRouter)`.
- Routes never hold state. All reads and writes go through `db/store.js`. Add a store helper (and export it) before using it from a route.
- Add a `reset()`-friendly seed in the store for any new collection so tests can start clean.

## Requests

- Parse path ids with `Number(req.params.id)` and reject anything that is not a positive integer with `400` before calling the store:

  ```js
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: 'id must be a positive integer' });
  }
  ```

- Validate the body in the route. Required fields missing or the wrong type means `400`.
- Pick the fields you store explicitly (`const { name, email } = req.body`), never spread `req.body` into the store.

## Responses

| Case | Status | Body |
|---|---|---|
| Read ok | `200` | the record or list |
| Created | `201` | the new record, with its `id` |
| Bad input | `400` | `{ "error": "message" }` |
| Unknown id | `404` | `{ "error": "<Thing> not found" }` |

Every error is JSON with a single `error` string. No HTML, no stack traces.

## Tests

For every new route add at least: one success test, one `400` test per required field, and one `404` test if the route takes an id. Use `node:test`, `supertest` and `store.reset()` in `beforeEach`, like `tests/users.test.js`.

## Before you finish

Run `npm test` and `npm run lint` in the project folder. Update `docs/api.md` if the endpoint is public.
