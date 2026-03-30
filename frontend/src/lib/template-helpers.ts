import type {
  AdditionalRemarkField,
  AdditionalRemarksSection,
  CompetencyGroup,
  IdpSection,
  PerformanceFactorsSection,
  RatingPoint,
  SelfReflectionQuestion,
  SelfReflectionSection,
  SubFactor,
} from "@/features/appraisal-templates/types"


export function newSelfReflectionSection(): SelfReflectionSection {
  return {
    id: crypto.randomUUID(),
    type: "self_reflection",
    title: "Self Appraisal",
    description: "Reflect on your achievements and areas of improvement.",
    questions: [],
  }
}

export function newPerformanceFactorsSection(): PerformanceFactorsSection {
  return {
    id: crypto.randomUUID(),
    type: "performance_factors",
    title: "Performance Factors",
    description: "Rate your performance across key competency areas.",
    competency_groups: [],
  }
}

export function newIdpSection(): IdpSection {
  return {
    id: crypto.randomUUID(),
    type: "idp",
    title: "Individual Development Plan",
    description: "",
    category_descriptions: [
      { category: "Technical", description: "" },
      { category: "Behavioural", description: "" },
      { category: "Functional", description: "" },
    ],
  }
}

export function newAdditionalRemarksSection(): AdditionalRemarksSection {
  return {
    id: crypto.randomUUID(),
    type: "additional_remarks",
    title: "Additional Remarks",
    description: "",
    fields: [],
  }
}

export function newQuestion(order: number): SelfReflectionQuestion {
  return {
    id: crypto.randomUUID(),
    question_text: "",
    word_limit: 250,
    is_required: true,
    order,
  }
}

export function newCompetencyGroup(): CompetencyGroup {
  return {
    id: crypto.randomUUID(),
    name: "New Competency Group",
    condition: null,
    sub_factors: [],
  }
}

export function newSubFactor(order: number): SubFactor {
  const min = 1
  const max = 5
  return {
    id: crypto.randomUUID(),
    name: "",
    description: "",
    rating_scale_min: min,
    rating_scale_max: max,
    order,
    rating_points: syncRatingPoints([], min, max),
  }
}

export function syncRatingPoints(
  existing: RatingPoint[],
  min: number,
  max: number
): RatingPoint[] {
  if (min > max) return existing
  const existingMap = new Map(existing.map((rp) => [rp.rating, rp]))
  const result: RatingPoint[] = []
  for (let r = min; r <= max; r++) {
    result.push(existingMap.get(r) ?? newRatingPoint(r))
  }
  return result
}

export function newRatingPoint(rating: number): RatingPoint {
  return {
    id: crypto.randomUUID(),
    rating,
    description: "",
  }
}

export function newRemarkField(): AdditionalRemarkField {
  return {
    id: crypto.randomUUID(),
    label: "",
  }
}
