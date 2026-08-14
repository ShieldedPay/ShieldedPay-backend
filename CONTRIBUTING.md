# Contributing to ShieldedPay Backend

Thank you for your interest in contributing to ShieldedPay Backend! We welcome contributions from the community.

## Getting Started

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Make your changes following existing conventions (TypeScript strict)
4. Run `pnpm lint` and ensure no new errors
5. Commit with a descriptive message
6. Push and open a Pull Request against `main`

## Guidelines

- **Keep PRs focused** — one feature or fix per PR
- Add SQL migration scripts in `scripts/` for any schema change, following the existing `NNN-description.sql` naming
- Mark crypto placeholders clearly with `// TODO: Production — use real ZK circuit` — the current crypto module uses simulated (SHA256-based) commitments, not a real ZK-SNARK circuit, and PRs should not blur that distinction
- **Update documentation** (README's API Endpoints / Database tables) when adding or changing routes or schema

## Code Style

- TypeScript strict mode — no implicit `any`
- Run `pnpm lint` (ESLint) before committing
- Match existing API route and query patterns rather than introducing new ones

## Commit Messages

Use conventional commit format:

- `feat: add new feature`
- `fix: correct bug`
- `docs: update documentation`
- `chore: maintenance tasks`
- `refactor: code restructuring`

## Reporting Issues

- Check existing issues before creating a new one
- Provide a clear description of the problem, including the affected endpoint or table
- Include steps to reproduce (request payload, expected vs. actual response)
- Suggest a solution if you have one

## Security issues

Do not open a public issue for a security vulnerability — see [SECURITY.md](SECURITY.md).

## Questions?

Open a discussion or issue for any questions about contributing.
