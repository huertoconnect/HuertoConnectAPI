import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-splash-screen',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './splash-screen.component.html',
  styleUrls: ['./splash-screen.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SplashScreenComponent implements OnInit, OnDestroy {
  @Output() splashComplete = new EventEmitter<void>();

  isHidden = false;
  isFadingOut = false;

  loadPercent = 0;
  loadingText = 'INITIALIZING';
  arcOffset = 1000;

  // Phase flags driven by percentage — everything starts from 0%
  phaseRoots = true;      // 0% — roots visible immediately
  phaseOrbits = true;     // 0% — orbits active immediately
  phaseStem = true;       // 0% — stem starts growing
  phaseLeaves = false;    // 50% — leaves unfold
  phaseAlive = false;     // 85% — idle breathing
  phaseReady = false;     // 100% — ready

  // Continuous progress values (0 to 1)
  stemProgress = 0;
  leafOpacity = 0;
  rootGlow = 0;
  smallStemProgress = 0;

  private readonly ARC_TOTAL = 1000;
  private readonly LOAD_DURATION_MS = 3800;
  private readonly FADE_START_MS = 4200;
  private readonly HIDE_MS = 5000;

  private rafId: number | null = null;
  private loadStartTs = 0;
  private fadeTimeout: ReturnType<typeof setTimeout> | null = null;
  private hideTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.rafId = requestAnimationFrame((ts) => this.tick(ts));

    this.fadeTimeout = setTimeout(() => {
      this.isFadingOut = true;
      this.cdr.markForCheck();
    }, this.FADE_START_MS);

    this.hideTimeout = setTimeout(() => {
      this.isHidden = true;
      this.splashComplete.emit();
      this.cdr.markForCheck();
    }, this.HIDE_MS);
  }

  ngOnDestroy(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    if (this.fadeTimeout) {
      clearTimeout(this.fadeTimeout);
      this.fadeTimeout = null;
    }

    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
  }

  private tick(timestamp: number): void {
    if (!this.loadStartTs) {
      this.loadStartTs = timestamp;
    }

    const elapsed = timestamp - this.loadStartTs;
    const rawProgress = Math.min(elapsed / this.LOAD_DURATION_MS, 1);
    const eased = this.easeInOutCubic(rawProgress);
    const percent = Math.round(eased * 100);

    this.loadPercent = percent;
    this.arcOffset = this.ARC_TOTAL * (1 - eased);
    this.loadingText = this.resolveLoadingText(percent);

    // Root glow: 0% → 25% (fade in from start)
    if (percent <= 25) {
      this.rootGlow = percent / 25;
    } else {
      this.rootGlow = 1;
    }

    // Stem growth: 0% → 55% (grows from the very start)
    if (percent <= 55) {
      this.stemProgress = percent / 55;
    } else {
      this.stemProgress = 1;
    }

    // Leaves: 50% → 75%
    this.phaseLeaves = percent >= 50;
    if (percent >= 50 && percent <= 75) {
      this.leafOpacity = (percent - 50) / 25;
    } else if (percent > 75) {
      this.leafOpacity = 1;
    }

    // Small stem: 65% → 80%
    if (percent >= 65 && percent <= 80) {
      this.smallStemProgress = (percent - 65) / 15;
    } else if (percent > 80) {
      this.smallStemProgress = 1;
    }

    // Alive phase (idle breathing): 85%+
    this.phaseAlive = percent >= 85;
    this.phaseReady = percent >= 100;

    this.cdr.markForCheck();

    if (rawProgress < 1) {
      this.rafId = requestAnimationFrame((ts) => this.tick(ts));
    }
  }

  // Stem dashoffset: 126 = hidden, 0 = fully drawn
  get stemDashOffset(): number {
    return 126 * (1 - this.stemProgress);
  }

  // Small stem dashoffset: 44 = hidden, 0 = fully drawn
  get smallStemDashOffset(): number {
    return 44 * (1 - this.smallStemProgress);
  }

  private resolveLoadingText(progress: number): string {
    if (progress < 15) {
      return 'INITIALIZING';
    }
    if (progress < 25) {
      return 'SCANNING ROOTS';
    }
    if (progress < 40) {
      return 'SYNCING ORBITS';
    }
    if (progress < 60) {
      return 'GROWING CORE';
    }
    if (progress < 80) {
      return 'NURTURING LIFE';
    }
    if (progress < 100) {
      return 'FINALIZING';
    }
    return 'SYSTEM READY';
  }

  private easeInOutCubic(value: number): number {
    if (value < 0.5) {
      return 4 * value * value * value;
    }
    return 1 - Math.pow(-2 * value + 2, 3) / 2;
  }
}
