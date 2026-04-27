---
title: SMART 시스템
aliases: [SMART, System for the Mechanical Analysis and Retrieval of Text]
tags: [type/concept, domain/ir, domain/nlp, status/active]
created: 2026-04-27
updated: 2026-04-27
sources: [010_1968_제라드 솔턴_벡터공간 TF-IDF.md, 010_1968_제라드 솔턴_벡터공간 TF-IDF_해설.md]
status: active
---

# SMART 시스템

SMART(System for the Mechanical Analysis and Retrieval of Text) 시스템은 [[제라드 솔턴]]의 [[정보 검색]] 연구 프로그램에서 개발된 텍스트 검색 시스템이다. 이 소스에서는 [[벡터 공간 모델]], [[TF-IDF]], [[코사인 유사도]]를 실험하고 평가한 대표적 시스템으로 등장한다.

SMART의 중요한 구현 아이디어는 [[희소 벡터]] 표현이다. 전체 어휘의 모든 차원을 저장하지 않고, 가중치가 0이 아닌 용어와 값만 저장하면 문서 컬렉션을 훨씬 효율적으로 다룰 수 있다.

또한 SMART는 질의 확장과 관련성 피드백 같은 상호작용적 검색 기법을 실험했다. 사용자가 어떤 결과가 관련 있는지 알려 주면, 시스템은 그 피드백을 이용해 질의 벡터를 관련 문서 쪽으로 이동시킬 수 있다.

## 출처

- [[010_1968_제라드 솔턴_벡터공간 TF-IDF]]

## 관련 항목
- [[제라드 솔턴]]
- [[정보 검색]]
- [[벡터 공간 모델]]
- [[TF-IDF]]
- [[희소 벡터]]
