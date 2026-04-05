import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SUBSCRIPTION_APP_PATHS } from '../subscription-app.constants';

/** Old `/subscription/quotation-template?id=` → form; bare URL → list. */
@Component({
  standalone: true,
  template: '',
})
export class QuotationTemplateLegacyRedirectComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  ngOnInit(): void {
    const raw = this.route.snapshot.queryParamMap.get('id');
    const id = raw ? Number(raw) : NaN;
    if (Number.isInteger(id) && id > 0) {
      void this.router.navigateByUrl(
        `${SUBSCRIPTION_APP_PATHS.quotationTemplateNew}?id=${encodeURIComponent(String(id))}`,
        { replaceUrl: true },
      );
    } else {
      void this.router.navigateByUrl(SUBSCRIPTION_APP_PATHS.quotationTemplates, { replaceUrl: true });
    }
  }
}
