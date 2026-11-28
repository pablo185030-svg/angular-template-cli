import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { VersionService } from '@shared/version/version.service';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Footer {
  protected readonly version = inject(VersionService).getVersion();
  protected readonly year = new Date().getFullYear();
}
