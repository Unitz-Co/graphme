#1 Usage

# 2. Test Setup
# 2.1 Installation:
1. GraphQL mock with Hasura
   1. Install docker: `brew install docker`
   2. Install dockerize: `brew install dockerize` : to wait for mock server ready before running test
   3. Start mock server:
      1. Start mock server manually: `yarn mock:up`
      2. Mock server can start automatically via `pretest` hook
