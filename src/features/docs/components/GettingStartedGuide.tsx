import { env } from "@/config/env";
import { Alert, AlertDescription, AlertTitle, Typography } from "@quickadui/core";
import { Stack } from "@quickadui/layout";
import type { ReactNode } from "react";
// Les exemples sont de vrais fichiers, testés : la page affiche exactement le code vérifié.
import loginPageCode from "../examples/LoginPage.tsx?raw";
import serverCode from "../examples/server.mjs?raw";
import viteConfigCode from "../examples/vite.config.example.ts?raw";
import { CodeBlock } from "./CodeBlock";
import { DocStep } from "./DocStep";

const ARCHITECTURE = `
Navigateur (React)          Votre back (Node)                 API d'authentification
  LoginPage.tsx   ──/auth──▶  server.mjs          ──x-app-id──▶   /consumers/auth/*
                              (détient le secret)   x-app-secret
`;

const P = ({ children }: { children: ReactNode }) => (
  <Typography className="text-neutral-11">{children}</Typography>
);
const C = ({ children }: { children: ReactNode }) => (
  <code className="rounded bg-neutral-3 px-1 py-0.5 font-mono text-[0.9em] text-neutral-12">
    {children}
  </code>
);

export interface GettingStartedGuideProps {
  /** Lien vers la création de compte ou vers les applications, selon que le lecteur est connecté. */
  accountLink: ReactNode;
  appsLink: ReactNode;
}

/** Guide d'intégration pas à pas : du compte tenant à une application Node + React connectée. */
export function GettingStartedGuide({ accountLink, appsLink }: GettingStartedGuideProps) {
  const envFile = `
AUTH_API_URL=${env.apiBaseUrl}
AUTH_APP_ID=<x-app-id de votre application>
AUTH_APP_SECRET=<x-app-secret de votre application>
`;

  return (
    <Stack gap="xl">
      <Stack gap="sm">
        <P>
          Cette API gère l'inscription, la connexion (avec double authentification par e-mail), les
          sessions et le mot de passe oublié des utilisateurs de <strong>vos</strong> applications.
          Chaque application a ses propres identifiants et ses propres utilisateurs.
        </P>
        <CodeBlock title="architecture" code={ARCHITECTURE} />
        <P>
          Le navigateur ne parle jamais directement à l'API : il passe par votre back, qui seul
          connaît le secret de l'application.
        </P>
      </Stack>

      <DocStep number={1} title="Créer votre compte">
        <P>
          Créez un compte sur ce dashboard et confirmez votre adresse avec le code reçu par e-mail.{" "}
          {accountLink}
        </P>
      </DocStep>

      <DocStep number={2} title="Déclarer votre application">
        <P>
          Dans {appsLink}, créez une application : nom, URL de redirection, URL de réinitialisation
          du mot de passe et e-mail de support. Sa page de détail affiche ses identifiants{" "}
          <C>x-app-id</C> et <C>x-app-secret</C>.
        </P>
        <Alert variant="warning">
          <AlertTitle>Le secret reste côté serveur</AlertTitle>
          <AlertDescription>
            Il donne accès à tous les comptes de l'application : jamais dans un front web ou mobile,
            jamais dans Git. En cas de fuite, régénérez-le depuis le dashboard.
          </AlertDescription>
        </Alert>
      </DocStep>

      <DocStep number={3} title="Configurer votre back">
        <P>Dans le fichier d'environnement de votre back (non versionné) :</P>
        <CodeBlock title=".env" code={envFile} />
      </DocStep>

      <DocStep number={4} title="Relayer l'authentification depuis votre back (Node / Express)">
        <P>
          Installez Express (<C>npm install express</C>, Node 20+), puis lancez ce serveur avec les
          variables de l'étape 3 (<C>node --env-file=.env server.mjs</C>). Il relaie inscription,
          vérification d'e-mail, connexion, refresh et déconnexion, et protège une route métier.
        </P>
        <CodeBlock title="server.mjs" code={serverCode} />
      </DocStep>

      <DocStep number={5} title="Connecter votre front (React)">
        <P>
          En développement, redirigez <C>/auth</C> et <C>/api</C> vers votre back : navigateur et
          back partagent alors la même origine, sans configuration CORS.
        </P>
        <CodeBlock title="vite.config.ts" code={viteConfigCode} />
        <P>
          La page de connexion gère la double authentification : si l'API répond{" "}
          <C>MFARequired: true</C>, elle demande le code reçu par e-mail.
        </P>
        <CodeBlock title="LoginPage.tsx" code={loginPageCode} />
      </DocStep>

      <DocStep number={6} title="Gérer les sessions">
        <Stack gap="xs" as="ul" className="list-disc pl-5 text-neutral-11">
          <li>
            L'access token dure 1 h par défaut. À l'expiration (<C>401</C>), appelez{" "}
            <C>/auth/refresh</C> avec le refresh token.
          </li>
          <li>
            Chaque refresh token ne sert <strong>qu'une fois</strong> : gardez toujours le dernier
            reçu. Réutiliser un ancien refresh token ferme toutes les sessions de l'utilisateur
            (protection contre le vol).
          </li>
          <li>
            Stockez les tokens de préférence dans un cookie <C>httpOnly</C> posé par votre back,
            plutôt qu'en <C>localStorage</C>, lisible par un script injecté.
          </li>
          <li>
            À la déconnexion, appelez <C>/auth/logout</C> : le refresh token et l'access token
            associé sont révoqués immédiatement.
          </li>
        </Stack>
      </DocStep>

      <DocStep number={7} title="Aller plus loin">
        <Stack gap="xs" as="ul" className="list-disc pl-5 text-neutral-11">
          <li>
            <strong>Vérification d'e-mail</strong> : un code est envoyé à l'inscription (
            <C>/consumers/auth/verifyEmail</C>). Si l'application l'exige, l'inscription ne renvoie
            pas de tokens et la connexion répond <C>403 emailNotVerified</C> tant que l'adresse
            n'est pas confirmée.
          </li>
          <li>
            <strong>Double authentification</strong> : l'utilisateur l'active avec{" "}
            <C>/consumers/auth/requestMFA</C> puis <C>/consumers/auth/activateMFA</C>.
          </li>
          <li>
            <strong>Mot de passe oublié</strong> : <C>/consumers/auth/forgotPassword</C> (code par
            e-mail), puis <C>/consumers/auth/verifyResetCode</C> (jeton à usage unique), puis{" "}
            <C>/consumers/auth/resetPassword</C>. À relayer par votre back comme les autres routes.
          </li>
          <li>
            <strong>Erreurs</strong> : toutes les erreurs ont la forme{" "}
            <C>{"{ error: { status, code, message } }"}</C> ; utilisez <C>code</C> pour réagir (
            <C>invalidCredentials</C>, <C>invalidCode</C>, <C>tooManyRequests</C>…).
          </li>
          <li>
            <strong>Référence complète</strong> : la documentation Swagger de l'API,{" "}
            <a
              href={`${env.apiBaseUrl}/api-docs`}
              target="_blank"
              rel="noreferrer"
              className="text-accent-11 underline-offset-4 hover:underline"
            >
              {env.apiBaseUrl}/api-docs
            </a>
            .
          </li>
        </Stack>
      </DocStep>
    </Stack>
  );
}
