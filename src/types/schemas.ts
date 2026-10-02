// JSON Schemas for AI structured output and runtime validation

export const FINDING_JSON_SCHEMA = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "JetEngineFinding",
  type: "object",
  required: [
    "id",
    "title",
    "affectedPartIds",
    "category",
    "severity",
    "confidence",
    "evidence",
    "valueOrigin",
    "probableCause",
    "consequenceIfUnresolved",
    "recommendedFix",
    "isAutoFixable"
  ],
  properties: {
    id: { type: "string" },
    title: { type: "string" },
    affectedPartIds: {
      type: "array",
      items: { type: "string" }
    },
    category: {
      type: "string",
      enum: ["design", "manufacturing", "thermal", "structural", "aerodynamic", "vibration", "maintenance"]
    },
    severity: {
      type: "string",
      enum: ["Critical", "High", "Medium", "Low", "Info"]
    },
    confidence: {
      type: "number",
      minimum: 0,
      maximum: 100
    },
    evidence: { type: "string" },
    valueOrigin: {
      type: "string",
      enum: ["Measured", "Calculated", "Estimated"]
    },
    pinCoordinates: {
      type: "array",
      items: { type: "number" },
      minItems: 3,
      maxItems: 3
    },
    probableCause: { type: "string" },
    consequenceIfUnresolved: { type: "string" },
    recommendedFix: { type: "string" },
    isAutoFixable: { type: "boolean" },
    applicableStandard: { type: "string" }
  }
};

export const FIX_JSON_SCHEMA = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "JetEngineFix",
  type: "object",
  required: [
    "id",
    "findingId",
    "title",
    "description",
    "affectedPartId",
    "autoFixType",
    "impactMetrics"
  ],
  properties: {
    id: { type: "string" },
    findingId: { type: "string" },
    title: { type: "string" },
    description: { type: "string" },
    affectedPartId: { type: "string" },
    autoFixType: {
      type: "string",
      enum: [
        "mesh_healing",
        "thicken_wall",
        "adjust_clearance",
        "rotor_balancing",
        "fillet_stress_relief",
        "invert_normals"
      ]
    },
    impactMetrics: {
      type: "array",
      items: {
        type: "object",
        required: ["metric", "before", "after"],
        properties: {
          metric: { type: "string" },
          before: { type: ["string", "number"] },
          after: { type: ["string", "number"] },
          unit: { type: "string" },
          deltaPercent: { type: "number" }
        }
      }
    }
  }
};
