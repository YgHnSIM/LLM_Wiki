---
title: LMS 알고리즘
aliases: [Least Mean Squares, LMS, 최소 평균 제곱 알고리즘]
tags: [type/concept, domain/ai, domain/machine-learning, domain/signal-processing, status/active]
created: 2026-04-27
updated: 2026-04-27
sources: [006_1962_위드로-호프_MADALINE.md, 006_1962_위드로-호프_MADALINE_해설.md]
status: active
---

# LMS 알고리즘

LMS 알고리즘(Least Mean Squares)은 목표 출력과 실제 출력 사이의 평균 제곱 오차를 줄이도록 가중치를 점진적으로 갱신하는 학습 규칙이다. 현재 소스는 LMS를 [[ADALINE]]과 [[MADALINE]]의 핵심 학습 알고리즘으로 설명한다.

LMS는 각 단계에서 오차와 입력값, [[학습률]]을 이용해 [[가중치]]를 수정한다. 이 규칙은 [[경사하강법]]의 단순한 형태로 볼 수 있으며, 계산이 가볍고 하드웨어 구현이 쉬워 초기 [[적응 신호 처리]]에 적합했다.

역사적으로 LMS는 [[역전파]]와 동일한 알고리즘은 아니지만, 오류 함수의 그래디언트를 따라 매개변수를 고친다는 현대 신경망 학습의 핵심 관점을 먼저 실용적으로 보여 준 사례다.

## 출처

- [[006_1962_위드로-호프_MADALINE]]

## 관련 항목
- [[위드로-호프 규칙]]
- [[ADALINE]]
- [[경사하강법]]
- [[적응 필터]]
- [[역전파]]
