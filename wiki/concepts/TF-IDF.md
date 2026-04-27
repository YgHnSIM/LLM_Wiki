---
title: TF-IDF
aliases: [Term Frequency-Inverse Document Frequency, term frequency inverse document frequency, tf-idf]
tags: [type/concept, domain/ai, domain/nlp, domain/ir, status/active]
created: 2026-04-27
updated: 2026-04-27
sources: [010_1968_제라드 솔턴_벡터공간 TF-IDF.md, 010_1968_제라드 솔턴_벡터공간 TF-IDF_해설.md]
status: active
---

# TF-IDF

TF-IDF(Term Frequency-Inverse Document Frequency)는 한 용어가 특정 문서에서 얼마나 중요한지를 계산하는 가중치 방식이다. [[벡터 공간 모델]]에서 문서 벡터의 각 차원 값으로 자주 쓰인다.

TF-IDF의 직관은 두 가지다. 첫째, 어떤 단어가 한 문서 안에서 자주 등장하면 그 문서의 주제와 관련 있을 가능성이 높다. 둘째, 거의 모든 문서에 등장하는 단어는 문서를 구별하는 데 별 도움이 되지 않는다.

수식으로는 보통 [[용어 빈도]]와 [[역문서 빈도]]의 곱으로 표현한다.

\[
\text{tfidf}(t,d)=tf(t,d)\times idf(t)
\]

이 방식은 [[정보 검색]], 문서 분류, 문서 군집화, 스팸 필터링 같은 과제에서 강력한 기준선이 되었다. 현대에는 [[BM25]]가 TF-IDF식 직관을 문서 길이 정규화와 빈도 포화로 확장한 대표적 후손으로 볼 수 있다.

한계도 분명하다. TF-IDF는 [[단어 주머니]] 표현에 기대므로 어순과 문맥을 잃고, [[어휘 불일치]] 문제에 취약하다. 이 한계가 [[조밀 벡터]]와 [[의미 검색]]의 발전을 자극했다.

## 출처

- [[010_1968_제라드 솔턴_벡터공간 TF-IDF]]

## 관련 항목
- [[벡터 공간 모델]]
- [[용어 빈도]]
- [[역문서 빈도]]
- [[코사인 유사도]]
- [[BM25]]
- [[희소 벡터]]
- [[어휘 불일치]]
