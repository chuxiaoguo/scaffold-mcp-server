// 导出所有匹配器相关的类型和函数
export { ScoreCalculator, type MatchingScore, type TemplateEntry } from './ScoreCalculator';
export { KeywordMatcher, type KeywordMatchResult } from './KeywordMatcher';
export { SmartMatcher, type MatchResult, type SmartMatchOptions } from './SmartMatcher';

// 重新导出原有的匹配函数以保持向后兼容
export { parseTechStack, matchFixedTemplate, smartMatchFixedTemplate } from '../matcher';