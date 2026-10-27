import { Component } from '@angular/core';
import { IonIcon, IonLabel, IonTabBar, IonTabButton, IonTabs } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { calendarOutline, cartOutline, ellipsisHorizontalOutline, restaurantOutline } from 'ionicons/icons';

@Component({
  selector: 'app-tabs',
  template: `
    <ion-tabs>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="calendario">
          <ion-icon name="calendar-outline"></ion-icon>
          <ion-label>Calendario</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="recetas">
          <ion-icon name="restaurant-outline"></ion-icon>
          <ion-label>Recetas</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="lista">
          <ion-icon name="cart-outline"></ion-icon>
          <ion-label>Lista</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="mas">
          <ion-icon name="ellipsis-horizontal-outline"></ion-icon>
          <ion-label>Más</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  `,
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
})
export class TabsPage {
  constructor() {
    addIcons({ calendarOutline, restaurantOutline, cartOutline, ellipsisHorizontalOutline });
  }
}
