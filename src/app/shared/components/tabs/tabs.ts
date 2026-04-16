import { Component, Input, model } from '@angular/core';

@Component({
  selector: 'app-tabs',
  imports: [],
  templateUrl: './tabs.html',
  styleUrl: './tabs.css',
})
export class Tabs {
  @Input() tabs: string[] = [];
  @Input() selectTab: (tab: string) => void = () => {};
  selectedTab = model<string>('');

}
