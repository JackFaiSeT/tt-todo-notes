import { describe, expect, it } from 'vitest'
import { findListenerViolations } from '../../../../../scripts/checks/lib/listener-rules.mjs'
import { buildVueSource, toSource } from '../../../../factories/script-source'

const FILE = 'src/shared/composables/useSample.ts'

describe('Scripts/listenerRules', () => {
  describe('findListenerViolations', () => {
    it.each([
      { source: "window.addEventListener('resize', onResize)", label: 'event listener' },
      { source: 'const observer = new ResizeObserver(onResize)', label: 'observer' },
      { source: 'const timer = setInterval(tick, 1000)', label: 'interval' },
      { source: 'const frame = window.requestAnimationFrame(draw)', label: 'animation frame' }
    ])('should report a leaked $label when it is never released', ({ source, label }) => {
      expect(findListenerViolations(source, FILE).leaks).toEqual([{ file: FILE, label, acquired: 1, released: 0 }])
    })

    it('should report a leak when listeners are added more often than removed', () => {
      const source = toSource(
        "el.addEventListener('focus', onFocus)",
        "el.addEventListener('blur', onBlur)",
        "el.removeEventListener('focus', onFocus)"
      )

      expect(findListenerViolations(source, FILE).leaks).toEqual([
        { file: FILE, label: 'event listener', acquired: 2, released: 1 }
      ])
    })

    it.each([
      { event: 'scroll', options: '' },
      { event: 'wheel', options: ', { capture: true }' },
      { event: 'touchstart', options: ', { passive: false }' }
    ])('should report the $event listener when it is not passive', ({ event, options }) => {
      const source = toSource(
        `window.addEventListener('${event}', handler${options})`,
        `window.removeEventListener('${event}', handler)`
      )

      expect(findListenerViolations(source, FILE).activeListeners).toEqual([{ file: FILE, line: 1, event }])
    })

    it('should ignore template expressions when checking a Vue script', () => {
      const source = buildVueSource('const isOpen = shallowRef<boolean>(false)', '<div>window.addEventListener(</div>')

      expect(findListenerViolations(source, 'src/shared/components/sample.vue')).toEqual({
        leaks: [],
        activeListeners: []
      })
    })

    it.each([
      {
        source: toSource("el.addEventListener('click', onClick)", "el.removeEventListener('click', onClick)"),
        label: 'a removed listener'
      },
      { source: "el.addEventListener('load', onLoad, { once: true })", label: 'a self-removing listener' },
      {
        source: toSource('const observer = new IntersectionObserver(onSeen)', 'observer.disconnect()'),
        label: 'a disconnected observer'
      },
      { source: toSource('const timer = setInterval(tick)', 'clearInterval(timer)'), label: 'a cleared interval' },
      {
        source: toSource('const frame = requestAnimationFrame(draw)', 'cancelAnimationFrame(frame)'),
        label: 'a cancelled animation frame'
      },
      { source: 'scheduler.setInterval(tick)', label: 'a method named like setInterval' },
      {
        source: toSource(
          "window.addEventListener('scroll', onScroll, { passive: true })",
          "window.removeEventListener('scroll', onScroll)"
        ),
        label: 'a passive scroll listener'
      }
    ])('should allow the source when it uses $label', ({ source }) => {
      expect(findListenerViolations(source, FILE)).toEqual({ leaks: [], activeListeners: [] })
    })
  })
})
