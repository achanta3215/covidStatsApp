import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AppService {

  private url = '../covidApi/india';
private topoJsonUrl = 'https://rawgit.com/Anujarya300/bubble_maps/master/data/geography-data/india.topo.json';
  constructor(private http: HttpClient) {
  }

  fetchTodayStats() {
    return this.http.get(this.url);
  }
  fetchTopoJsonData() {
    return this.http.get(this.topoJsonUrl);
  }
}
