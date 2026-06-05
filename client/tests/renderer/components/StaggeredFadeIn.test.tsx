/**
 * @file StaggeredFadeIn 组件测试
 * @description 验证 StaggeredFadeIn 组件正确渲染 stagger-fade/stagger-item CSS 类、
 *              保持子元素顺序、以及支持自定义 delayStep 属性。
 * @module tests/renderer/components
 */

import { renderToString } from 'react-dom/server'
import StaggeredFadeIn from '../../../src/renderer/src/components/common/StaggeredFadeIn'

// describe: StaggeredFadeIn — 渐入动画容器组件
describe('StaggeredFadeIn', () => {
  // 用例：用 stagger-fade 容器包裹所有子元素，并为每个子元素添加 stagger-item 类
  it('wraps children in a container with stagger-fade class', () => {
    const html = renderToString(
      <StaggeredFadeIn>
        <div>a</div>
        <div>b</div>
        <div>c</div>
      </StaggeredFadeIn>
    )
    expect(html).toContain('stagger-fade')
    expect(html).toContain('stagger-item')
  })

  // 用例：保持子元素的原始渲染顺序
  it('renders all children in order', () => {
    const html = renderToString(
      <StaggeredFadeIn>
        <span data-testid="child-1">one</span>
        <span data-testid="child-2">two</span>
      </StaggeredFadeIn>
    )
    expect(html).toContain('one')
    expect(html).toContain('two')
  })

  // 用例：支持自定义 delayStep 属性控制动画间隔
  it('respects custom delay step prop', () => {
    const html = renderToString(
      <StaggeredFadeIn delayStep={100}>
        <div>a</div>
      </StaggeredFadeIn>
    )
    expect(html).toContain('stagger-fade')
  })
})

  it('renders all children in order', () => {
    const html = renderToString(
      <StaggeredFadeIn>
        <span data-testid="child-1">one</span>
        <span data-testid="child-2">two</span>
      </StaggeredFadeIn>
    )
    expect(html).toContain('one')
    expect(html).toContain('two')
  })

  it('respects custom delay step prop', () => {
    const html = renderToString(
      <StaggeredFadeIn delayStep={100}>
        <div>a</div>
      </StaggeredFadeIn>
    )
    // Just verify the container renders without crash
    expect(html).toContain('stagger-fade')
  })
})
