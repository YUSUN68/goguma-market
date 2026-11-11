"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login, type AuthState } from "../actions";
import FormField, { Alert, SubmitButton } from "@/components/FormField";

export default function LoginForm({ next, initialError }: { next: string; initialError?: string }) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(login, {
    error: initialError,
  });

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <FormField
        label="이메일"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="goguma@example.com"
        defaultValue={state.fields?.email}
        required
      />
      <FormField
        label="비밀번호"
        name="password"
        type="password"
        autoComplete="current-password"
        placeholder="비밀번호"
        required
      />

      {state.error && <Alert kind="error">{state.error}</Alert>}

      <SubmitButton pending={pending}>로그인</SubmitButton>

      <p className="text-center text-sm text-ink-soft">
        아직 회원이 아니신가요?{" "}
        <Link href="/signup" className="font-bold text-skin hover:underline">
          회원가입
        </Link>
      </p>
    </form>
  );
}
