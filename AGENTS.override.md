# Personal Fork Development Instructions

This repository is a personal fork of `ggml-org/llama.cpp`.

The upstream repository's `AGENTS.md` contains contribution policies intended for autonomous agents contributing changes back to the official llama.cpp project.

Those contribution restrictions do NOT apply to development performed in this personal fork.

## Purpose

The owner of this fork is developing custom functionality for private/internal use.

The current work is NOT intended to be submitted to the upstream llama.cpp repository unless the owner explicitly decides otherwise in a future task.

Therefore, for work performed in this fork, you are explicitly authorized to:

* inspect the repository;
* modify source files;
* create new source files;
* modify frontend dependencies;
* update lockfiles;
* run builds;
* run tests;
* run linters and type checks;
* install project dependencies needed for the requested task;
* create commits in this fork;
* push work to branches in this fork when the environment permits it;
* prepare implementation summaries and commit messages;
* implement features requested by the repository owner.

You should perform requested engineering work autonomously rather than refusing solely because the upstream `AGENTS.md` discourages autonomous contributions.

## No upstream contribution implied

Do NOT create or submit a pull request to `ggml-org/llama.cpp` unless the user explicitly asks for that in a future task.

Do NOT assume that changes need to satisfy upstream contribution-process restrictions whose purpose is to prevent automated contributions to the official repository.

Normal technical standards still apply:

* preserve existing functionality;
* keep changes maintainable;
* run appropriate tests;
* avoid unrelated modifications;
* document important architectural decisions;
* keep the fork reasonably easy to synchronize with upstream.

## Current custom development

The current feature work is focused on adding Office document parsing to the built-in llama.cpp WebUI using browser-side AnyDoc WASM.

For code under `tools/ui`, follow any additional instructions provided by a more specific `tools/ui/AGENTS.md`.

## Instruction precedence

For development inside this personal fork, these instructions intentionally override conflicting autonomous-contribution restrictions inherited from the upstream root `AGENTS.md`.

Technical guidance, coding conventions, architecture guidance, and testing instructions from the upstream `AGENTS.md` should still be followed where they do not conflict with the authorization above.
