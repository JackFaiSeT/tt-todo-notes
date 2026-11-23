const STRING_LIST = Object.freeze({ type: 'array', items: { type: 'string' } })

export const SETTINGS_SCHEMA = Object.freeze({
  type: 'object',
  properties: {
    appRoot: { type: 'string' },
    domainRoot: { type: 'string' },
    domainOrder: STRING_LIST,
    domainOrderFile: { type: 'string' },
    layerOrder: STRING_LIST,
    layerDependencyOrder: STRING_LIST,
    segmentOrder: STRING_LIST,
    aliases: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          root: { type: 'string' },
          domain: { type: 'string' },
          entry: { type: 'string' },
          segmentOrder: STRING_LIST,
          unitDepth: { type: 'integer', minimum: 0 }
        },
        required: ['name', 'root'],
        additionalProperties: false
      }
    }
  },
  additionalProperties: false
})
