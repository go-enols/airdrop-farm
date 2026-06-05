/**
 * @file i18n 国际化配置
 * @description 初始化 i18next 实例，加载简体中文翻译资源文件。
 *              当前应用仅支持中文界面，默认语言和回退语言均为 'zh-CN'。
 * @module renderer/i18n
 */
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import zhCN from './zh-CN.json'

i18n.use(initReactI18next).init({
  /** 翻译资源：仅加载简体中文 */
  resources: { 'zh-CN': { translation: zhCN } },
  /** 默认语言 */
  lng: 'zh-CN',
  /** 回退语言（key 无对应翻译时使用） */
  fallbackLng: 'zh-CN',
  /** 不转义输出中的 HTML/特殊字符 */
  interpolation: { escapeValue: false }
})

export default i18n
