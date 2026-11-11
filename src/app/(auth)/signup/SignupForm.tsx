"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signup, type AuthState } from "../actions";
import FormField, { Alert, SubmitButton } from "@/components/FormField";

export default function SignupForm() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(signup, {});

  // 인증 메일을 보낸 뒤에는 안내만 보여줘요
  if (state.message) {
    return (
      <div className="space-y-4 text-center">
        <Alert kind="success">{state.message}</Alert>
        <Link href="/login" className="inline-block text-sm font-bold text-skin hover:underline">
          로그인 화면으로 →
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <FormField
        label="닉네임"
        name="nickname"
        placeholder="달달한고구마"
        minLength={2}
        maxLength={12}
        hint="2~12자, 거래할 때 보여지는 이름이에요"
        defaultValue={state.fields?.nickname}
        required
      />
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
        autoComplete="new-password"
        placeholder="6자 이상"
        minLength={6}
        required
      />
      <FormField
        label="비밀번호 확인"
        name="passwordConfirm"
        type="password"
        autoComplete="new-password"
        placeholder="한 번 더 입력"
        minLength={6}
        required
      />

      {state.error && <Alert kind="error">{state.error}</Alert>}

      <SubmitButton pending={pending}>가입하고 시작하기</SubmitButton>

      <p className="text-center text-sm text-ink-soft">
        이미 회원이신가요?{" "}
        <Link href="/login" className="font-bold text-skin hover:underline">
          로그인
        </Link>
      </p>
    </form>
  );
}
