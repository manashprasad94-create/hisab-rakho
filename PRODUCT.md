# Hisab Kitab

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

College students and young adults who split expenses, lend or borrow money from
friends, and need an easy way to keep track of pending payments. Mobile use is
the primary design priority.

## Product Purpose

A personal and friends money tracker that organizes money to receive, money to
pay, the people involved, and outstanding balances in one place.

## Operating Context

Users record shared expenses, review transaction requests, claim payments, and
confirm receipt. Existing features also cover personal expenses, private notes,
group funds, separate cash and online holder balances, deposits with reasons and
dates, and transaction history. Currency and UPI workflows follow the existing
Indian financial context.

## Capabilities and Constraints

- Preserve the React/TypeScript, Vite, Tailwind, and Supabase architecture.
- Preserve business logic, authentication, database structure, permissions,
  Supabase functions, and existing core features during UI refinement.
- Keep transaction and payment confirmation workflows clear and distinct.
- Preserve fund owner, admin/co-owner, and member permissions.
- Keep monetary amounts, dates, participants, and history readable and accurate.
- Live backend deployment status must not be inferred from frontend code.

## Brand Commitments

Hisab Kitab should feel friendly, trustworthy, modern, and extremely easy to use.
The requested direction is a polished, premium SaaS interface with restrained
decoration. Avoid excessive gradients, glassmorphism, and generic AI styling.

## Product Principles

- Make the next money-tracking action easy to find.
- Prefer clarity and readable amounts over decoration.
- Apply one component vocabulary throughout the app.
- Design for mobile first and support larger screens intentionally.
- Show loading, empty, error, and selected states clearly.

## Accessibility & Inclusion

Accessible contrast, visible keyboard focus, readable text, labeled controls,
comfortable touch targets, and support for reduced motion are required. Additional
languages and product-specific assistive requirements remain undecided.

## Evidence on Hand

The existing implementation is in `src/`; feature descriptions are in `README.md`.
Database and function deployment notes are in `docs/AUDIT_FIXES.md` and
`docs/REMINDERS.md`. Marketing examples are illustrative, not live user data.
