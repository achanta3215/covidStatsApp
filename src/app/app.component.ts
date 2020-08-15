/// <reference types="datamaps" />
declare class Datamap { constructor(options: DataMapOptions); }
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { AppService } from './app.service';
import { states } from '../utils/constants';
import { MatButtonToggleChange } from '@angular/material/button-toggle';
interface StateProps {
  state: string;
  active: string;
  discharged: string;
  deceased: string;
  total: string;
}
interface StateData extends StateProps {
  delta?: StateProps | {};
}

interface Data {
  [stateName: string]: StateData; 
}

type DataViewToggleValue = 'D' | 'C'; 

const getDefaultNumeric = (val: any, defaultVal?: string): string => {
  return isNaN(val) ? (defaultVal || '0') : val;
}
const getStatePropValue = (
  state: StateData, 
  stateProp: keyof StateProps,
  dataViewToggleValue: DataViewToggleValue, 
): string => {
  if (dataViewToggleValue === 'C') {
    return getDefaultNumeric(state[stateProp]);
  }
  return getDefaultNumeric(state.delta && state.delta[stateProp]);
};

const getStatePropAverageValue = (
  data: Data,
  stateProp: keyof StateProps,
  dataViewToggleValue: DataViewToggleValue,
): string => {
  return Object.entries(data).reduce((totalValue, stateEntry) => {
    const [_, stateData] = stateEntry;
    return String(Number(totalValue) + Number(getStatePropValue(stateData, stateProp, dataViewToggleValue)));
  }, '0');
};

const getBubbles = (
  data: Data,
  dataViewToggleValue: DataViewToggleValue, 
  stateProp: keyof StateProps,
) => {
  return Object.entries(data).map(([_, state]) => {
    const averageValue = getStatePropAverageValue(data, stateProp, dataViewToggleValue);
    const statePropValue = getStatePropValue(state, stateProp, dataViewToggleValue);

    const factor = 100;
    const radius = getDefaultNumeric((Number(statePropValue) / Number(averageValue)) * factor, '1');
    return {
      centered: states[state.state],
      state: state.state,
      statePropValue, 
      average: averageValue,
      radius,
    }
  });
};

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  dataViewToggleValue: DataViewToggleValue ='C';
  dataPropToggleValue: keyof StateProps ='total';
  onChangeDataViewToggle(val: DataViewToggleValue) {
    this.dataViewToggleValue = val;
    this.refreshData();
  }
  onChangeDataPropToggle(val: keyof StateProps) {
    this.dataPropToggleValue= val;
    this.refreshData();
  }
  data: Data = {};
  topoJsonData: any = {};
  bubbleMap: any;
  refreshData() {
    this.bubbleMap.options.data = {
      JH: { fillKey: 'MAJOR' },
      MH: { fillKey: 'MAJOR' },
    };
    const ourBubbles = getBubbles(this.data, this.dataViewToggleValue, this.dataPropToggleValue);
    // ISO ID code for city or <state></state>
    setTimeout(() => { // only start drawing bubbles on the map when map has rendered completely.
      // @ts-ignore
      this.bubbleMap.bubbles(ourBubbles, {
        popupTemplate: (geo, data) => {
          return `<div class="hoverinfo">State: ${data.state}, Count: ${data.statePropValue}</div>`;
        }
      });
    }, 1000);
  }

  constructor(appService: AppService) {
    appService.fetchTodayStats().subscribe((stats: any) => {
      this.data = stats;
      console.log(stats);
      this.refreshData();
    });
    appService.fetchTopoJsonData().subscribe((_topoJsonData: any) => {
      this.topoJsonData = _topoJsonData;
    });
  }

  title = 'covidStatsApp';
  ngOnInit(): void {
      this.bubbleMap = new Datamap({
      element: document.getElementById('india'),
      scope: 'india',
      geographyConfig: {
          popupOnHover: true,
          highlightOnHover: true,
          borderColor: '#444',
          borderWidth: 0.5,
          dataUrl: 'https://rawgit.com/Anujarya300/bubble_maps/master/data/geography-data/india.topo.json',
      },
      fills: {
          MAJOR: '#306596',
          MEDIUM: '#0fa0fa',
          MINOR: '#bada55',
          defaultFill: '#dddddd',
      },
      setProjection: (element) => {
          const projection = d3.geo.mercator()
              .center([78.9629, 23.5937]) // always in [East Latitude, North Longitude]
              .scale(500)
              .translate([(element.offsetWidth / 2) - 30, (element.offsetHeight / 2)]);
          const path = d3.geo.path().projection(projection);
          return { path, projection };
      }
    });
    this.refreshData();
  }
}
