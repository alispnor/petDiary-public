# Spec 20 — Prompts originais (preservados sem edição)

> Salvos em 2026-05-02. Estão escritos para Node.js + BullMQ. **petDiary é
> Django + Celery** — ver `20-deploy-aws-producao.md` para versão adaptada e
> análise de viabilidade.

---

## Prompt 1 — Dockerfile produção + Compose + .env + Migrations

Atue como um Engenheiro DevOps Sênior especialista em AWS e Node.js. Estou preparando meu projeto PetDiary para ir para produção na AWS usando ECS (Fargate). Atualmente, uso um repositório Node.js único que contém minha API e meu processamento de filas com BullMQ. Na nuvem, usarei AWS RDS (PostgreSQL) e ElastiCache (Redis).

Tarefa:

Crie um Dockerfile de produção multi-stage otimizado, flexível para rodar a API ou o Worker dependendo do CMD.

Crie um docker-compose.prod.yml que declare APENAS a API e o Worker BullMQ.

Forneça um exemplo de .env.production com variáveis para conectar via SSL ao RDS e ao S3.

Explique como estruturar o comando no Node.js para rodar as migrations do banco de dados antes da API iniciar.

---

## Prompt 2 — Terraform AWS Infra

Atue como um Arquiteto Cloud Sênior especialista em AWS e Terraform. Preciso provisionar a infraestrutura de produção para o projeto PetDiary (Node.js/BullMQ).

Tarefa: Escreva os arquivos do Terraform (main.tf, variables.tf, etc.) para provisionar:

Rede: VPC com subnets públicas e privadas, e NAT Gateway.

Bancos e Filas: Uma instância RDS PostgreSQL e um cluster ElastiCache (Redis), ambos em subnets privadas.

Storage: Um bucket S3 para fotos e arquivos.

Computação: Um Cluster ECS configurado para usar Fargate.

Segurança: Security Groups restritos (RDS/Redis acessíveis apenas pelo ECS; ECS acessível apenas pelo Load Balancer).

CI/CD: IAM com OIDC para permitir deploy do GitHub Actions no ECS e ECR sem chaves estáticas.

---

## Prompt 3 — Git Flow + Branch Protection + Conventional Commits

Atue como um Arquiteto de Software e Especialista em Git. O projeto PetDiary precisa de um fluxo de trabalho profissional antes de ir para a AWS.

Tarefa:

Estratégia: Proponha um modelo de branching híbrido (Fluxo dev/master para Backend e Web; Fluxo release/vX.X.X para Mobile React Native).

Proteção: Liste as configurações exatas de Branch Protection no GitHub para proibir commits diretos e exigir aprovação em PRs para master e dev.

Boas Práticas: Recomende um padrão de mensagens (Conventional Commits) para gerar Changelogs automaticamente.

---

## Prompt 4 — GitHub Actions Deploy Backend ECS

Atue como um Engenheiro de DevOps e CI/CD Sênior. A infraestrutura do PetDiary está provisionada (ECS Fargate, RDS, S3) e o Git Flow configurado.

Tarefa: Escreva o .github/workflows/deploy-backend.yml para a branch master:

Faça autenticação segura na AWS via OIDC.

Faça o build da imagem Docker, gere a tag com o SHA do commit e envie para o Amazon ECR.

Execute uma standalone task rápida no ECS Fargate apenas para rodar as migrations do banco PostgreSQL.

Atualize as Task Definitions da API e do Worker e execute o deploy no ECS garantindo Rolling Update.

Explique como injetar variáveis do AWS Secrets Manager na Task Definition.

---

## Prompt 5 — Frontend Web S3 + CloudFront

Atue como um Arquiteto Cloud Sênior. Preciso estruturar a hospedagem de produção do frontend web (React) do PetDiary na AWS com máxima performance e baixo custo.

Tarefa:

Terraform: Escreva os scripts para provisionar um bucket S3 (site estático), CloudFront (CDN) com OAC, e certificado HTTPS gratuito (ACM).

GitHub Actions: Escreva o .github/workflows/deploy-web.yml para compilar o React injetando a URL da API de produção, sincronizar (aws s3 sync) com o bucket, e invalidar o cache do CloudFront (aws cloudfront create-invalidation).

---

## Prompt 6 — CI/CD Mobile (Expo EAS + GitHub Actions)

Atue como um Engenheiro DevOps Mobile Sênior. Precisamos estruturar o CI/CD do app PetDiary (React Native) para compilar e publicar automaticamente via GitHub Actions em conjunto com o Expo EAS.

Tarefa:

Liste as chaves e certificados necessários no GitHub Secrets (Play Store API, App Store Connect Key).

Forneça o eas.json com perfis separados para preview (.apk) e production (.aab/.ipa).

Escreva o .github/workflows/mobile-release.yml para rodar o build e submit de forma não interativa quando uma tag/release for gerada.

Explique como gerenciar o versionCode (Android) e buildNumber (iOS) de forma automática.
