# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

University students who want to learn and revise from their own course materials. The product should work especially well for students who benefit from low information density, explicit sequencing, flexible formats, and frequent knowledge checks, without asking for or inferring a medical diagnosis.

## Product Purpose

Tutorly turns a student's uploaded lectures, tutorials, labs, readings, assignment briefs, and historical practice materials into a personalized study environment. Success means a student can quickly understand a course concept, see which uploaded material supports an explanation, practise it, and understand what to study next.

## Positioning

Tutorly's defining mechanism is course-grounded learning: explanations, practice, priorities, and study formats are visibly connected to the student's actual university materials rather than presented as generic AI output.

## Operating Context

This is a front-end-only university presentation prototype. The core presentation journey is Intro → Dashboard → Course Materials → Revision Priorities → Five-stage Study Session → Learning Preferences, designed to be demonstrated reliably in two to three minutes.

The main demonstration course is Database Systems (CSCI235), using realistic mock lectures, tutorials, labs, past papers, and topics such as functional dependencies, normalization, ER diagrams, SQL JOINs, PL/SQL, and transactions.

## Capabilities and Constraints

- Simulate a course workspace, document upload and processing, a recommendation-led dashboard, a five-stage study session, source-grounded tutoring, practice, progress, and learning preferences.
- Use local mock data and local UI state only. No backend, authentication, database, vector database, embeddings, real retrieval pipeline, payments, or external AI calls.
- Sidebar navigation, upload states, study-session progression, answer feedback, hints, answers, tutor prompts, reporting, and preference controls should work visually.
- Source citations should appear wherever they improve trust. Simulated AI output must be presented as a prototype interaction rather than a live retrieval claim.
- Revision priorities are estimates based on emphasis across uploaded material, never predicted or guaranteed assessment content.
- Tutorly must not guarantee grades, diagnose neurodivergence, complete assessed work, or imply generated information is certainly correct.
- The interface should support responsive desktop and mobile use with a compact app sidebar and accessible interaction patterns.

## Brand Commitments

- Product name: Tutorly.
- Core message: “Upload what your course teaches. Tutorly helps you understand it, prioritize it, and practise it in a way that works for you.”
- Voice: calm, clear, supportive, credible, student-friendly, and professional enough for a university purchaser.
- The experience should reduce cognitive load and avoid childish styling, excessive color, and visual clutter.

## Evidence on Hand

The repository contains no customer claims, testimonials, outcomes data, or production AI evidence. The supplied realistic course data is demonstration content only and must not be presented as proof of a live backend or guaranteed academic outcome.

## Product Principles

1. Ground learning in the student's own course materials and make sources visible.
2. Show one clear next action and keep complex study workflows easy to scan.
3. Adapt presentation style without requiring personal or medical disclosure.
4. Communicate uncertainty and preserve academic integrity.
5. Make the complete presentation flow polished, predictable, and fast.

## Accessibility & Inclusion

Use semantic controls, visible focus states, keyboard-accessible interactions, clear contrast, reduced-motion support, responsive layouts, plain language, and low-information-density defaults. Students choose teaching preferences directly; Tutorly does not ask for or infer diagnoses.
