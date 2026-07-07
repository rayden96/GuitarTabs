// Sample-accurate playback engine using the Web Audio lookahead-scheduler pattern
// ("A Tale of Two Clocks"): a coarse JS timer schedules clicks slightly ahead on
// the audio clock, so timing stays solid even when the main thread is busy.

export interface EngineOptions {
  /** Read live so tempo changes apply from the next beat. */
  getTempo: () => number
  beatsPerBar: number
  /** Bars of count-in before beat 0 (count-in beats are negative). */
  countInBars: number
  totalBeats: number
  /** Read live; when set, playback wraps within [start, end). */
  getLoop: () => { start: number; end: number } | null
  /** Read live; whether to emit audible clicks (count-in always clicks). */
  getMetronomeOn: () => boolean
  /** Fired (via setTimeout, aligned to the audio clock) when a beat becomes current. */
  onBeat: (beat: number) => void
  onEnd: () => void
}

interface BeatRef {
  beat: number
  time: number
  secPerBeat: number
}

const LOOKAHEAD_MS = 25
const SCHEDULE_AHEAD_SEC = 0.12

export class PlaybackEngine {
  private ctx: AudioContext | null = null
  private timer: ReturnType<typeof setInterval> | null = null
  private timeouts: ReturnType<typeof setTimeout>[] = []
  private nextBeat = 0
  private nextBeatTime = 0
  private lastRef: BeatRef | null = null
  private opts: EngineOptions | null = null
  private ended = false

  get isRunning(): boolean {
    return this.timer !== null
  }

  start(opts: EngineOptions, fromBeat = 0): void {
    this.stop()
    this.opts = opts
    this.ended = false
    this.ctx = this.ctx ?? new AudioContext()
    void this.ctx.resume()
    this.nextBeat = fromBeat - opts.countInBars * opts.beatsPerBar
    this.nextBeatTime = this.ctx.currentTime + 0.08
    this.lastRef = null
    this.timer = setInterval(() => this.tick(), LOOKAHEAD_MS)
    this.tick()
  }

  stop(): void {
    if (this.timer !== null) clearInterval(this.timer)
    this.timer = null
    for (const t of this.timeouts) clearTimeout(t)
    this.timeouts = []
    this.lastRef = null
    this.opts = null
  }

  /** Current fractional beat position on the audio clock (for animations). */
  position(): number | null {
    if (!this.ctx || !this.lastRef) return null
    const { beat, time, secPerBeat } = this.lastRef
    return beat + (this.ctx.currentTime - time) / secPerBeat
  }

  private tick(): void {
    const ctx = this.ctx
    const opts = this.opts
    if (!ctx || !opts || this.ended) return

    while (this.nextBeatTime < ctx.currentTime + SCHEDULE_AHEAD_SEC) {
      const beat = this.nextBeat
      const time = this.nextBeatTime
      const secPerBeat = 60 / Math.max(20, Math.min(300, opts.getTempo()))

      if (beat >= opts.totalBeats) {
        this.ended = true
        this.dispatchAt(time, () => opts.onEnd())
        break
      }

      const isCountIn = beat < 0
      const beatInBar = ((beat % opts.beatsPerBar) + opts.beatsPerBar) % opts.beatsPerBar
      if (isCountIn || opts.getMetronomeOn()) {
        this.scheduleClick(time, beatInBar === 0, isCountIn)
      }
      this.dispatchAt(time, () => {
        this.lastRef = { beat, time, secPerBeat }
        opts.onBeat(beat)
      })

      // Advance, honoring the loop range.
      let next = beat + 1
      const loop = opts.getLoop()
      if (loop && beat >= 0 && next >= loop.end) next = loop.start
      this.nextBeat = next
      this.nextBeatTime = time + secPerBeat
    }
  }

  private dispatchAt(audioTime: number, fn: () => void): void {
    const ctx = this.ctx
    if (!ctx) return
    const delayMs = Math.max(0, (audioTime - ctx.currentTime) * 1000)
    this.timeouts.push(setTimeout(fn, delayMs))
  }

  private scheduleClick(time: number, accent: boolean, countIn: boolean): void {
    const ctx = this.ctx
    if (!ctx) return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'square'
    osc.frequency.value = countIn ? 1320 : accent ? 1100 : 880
    const peak = accent ? 0.5 : 0.3
    gain.gain.setValueAtTime(0.0001, time)
    gain.gain.exponentialRampToValueAtTime(peak, time + 0.002)
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.06)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(time)
    osc.stop(time + 0.08)
  }
}
