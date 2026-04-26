---
title: ADALINE
aliases: [ADAptive LINear Element, Adaptive Linear Element, 적응형 선형 소자]
tags: [type/concept, domain/ai, domain/machine-learning, domain/signal-processing, status/active]
created: 2026-04-27
updated: 2026-04-27
sources: [006_1962_위드로-호프_MADALINE.md, 006_1962_위드로-호프_MADALINE_해설.md]
status: active
---

# ADALINE

ADALINE(ADAptive LINear Element)은 [[버나드 위드로]]와 [[마션 호프]]가 개발한 적응형 선형 유닛이다. 현재 소스는 ADALINE을 [[MADALINE]]의 핵심 구성 요소이자 [[LMS 알고리즘]]이 작동하는 기본 단위로 설명한다.

ADALINE은 [[퍼셉트론]]처럼 입력의 가중합을 사용하지만, 학습 중에는 임계값을 지난 이진 출력이 아니라 임계값 적용 전의 연속 선형 출력을 사용한다. 이 차이 덕분에 목표 출력과 실제 출력의 오차를 더 정밀하게 계산하고 가중치를 안정적으로 갱신할 수 있다.

ADALINE의 한계는 선형 유닛이라는 점이다. 복잡한 비선형 표현을 자동으로 학습하지는 못하지만, [[적응 필터]]와 [[적응 신호 처리]]에서는 단순성과 안정성이 큰 장점으로 작용했다.

## 출처

- [[006_1962_위드로-호프_MADALINE]]

## 관련 항목
- [[MADALINE]]
- [[LMS 알고리즘]]
- [[퍼셉트론]]
- [[선형 분류기]]
- [[경사하강법]]
