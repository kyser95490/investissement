import { useState, useMemo } from "react";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";

const RAW_DATA = [{"Annee":2026,"Mois":"2026-03","Compteur":1,"Capital_debut":7000,"Gains":140,"Apport_perso":100,"Achat_ponctuel":0,"Retrait_securite":0.0,"Cagnotte_brute":240.0,"Nouveaux_packs":0,"Reste_cagnotte":240.0,"Gains_annuels":140,"Cumul_apport":7100,"Cagnotte_nette":0,"Capital_total":7240.0,"Performance_globale":0.02,"Nb_packs":7},{"Annee":2026,"Mois":"2026-04","Compteur":2,"Capital_debut":7000,"Gains":140,"Apport_perso":100,"Achat_ponctuel":0,"Retrait_securite":0.0,"Cagnotte_brute":480.0,"Nouveaux_packs":0,"Reste_cagnotte":480.0,"Gains_annuels":280,"Cumul_apport":7200,"Cagnotte_nette":0,"Capital_total":7480.0,"Performance_globale":0.04,"Nb_packs":7},{"Annee":2026,"Mois":"2026-05","Compteur":3,"Capital_debut":7000,"Gains":140,"Apport_perso":100,"Achat_ponctuel":0,"Retrait_securite":0.0,"Cagnotte_brute":720.0,"Nouveaux_packs":0,"Reste_cagnotte":720.0,"Gains_annuels":420,"Cumul_apport":7300,"Cagnotte_nette":0,"Capital_total":7720.0,"Performance_globale":0.06,"Nb_packs":7},{"Annee":2026,"Mois":"2026-06","Compteur":4,"Capital_debut":7000,"Gains":140,"Apport_perso":100,"Achat_ponctuel":0,"Retrait_securite":0.0,"Cagnotte_brute":960.0,"Nouveaux_packs":0,"Reste_cagnotte":960.0,"Gains_annuels":560,"Cumul_apport":7400,"Cagnotte_nette":0,"Capital_total":7960.0,"Performance_globale":0.08,"Nb_packs":7},{"Annee":2026,"Mois":"2026-07","Compteur":5,"Capital_debut":7000,"Gains":140,"Apport_perso":100,"Achat_ponctuel":0,"Retrait_securite":0.0,"Cagnotte_brute":1200.0,"Nouveaux_packs":1,"Reste_cagnotte":200.0,"Gains_annuels":700,"Cumul_apport":7500,"Cagnotte_nette":1000,"Capital_total":8200.0,"Performance_globale":0.09,"Nb_packs":7},{"Annee":2026,"Mois":"2026-08","Compteur":6,"Capital_debut":8000,"Gains":160,"Apport_perso":100,"Achat_ponctuel":0,"Retrait_securite":0.0,"Cagnotte_brute":460.0,"Nouveaux_packs":0,"Reste_cagnotte":460.0,"Gains_annuels":860,"Cumul_apport":7600,"Cagnotte_nette":0,"Capital_total":8460.0,"Performance_globale":0.11,"Nb_packs":8},{"Annee":2026,"Mois":"2026-09","Compteur":7,"Capital_debut":8000,"Gains":160,"Apport_perso":100,"Achat_ponctuel":0,"Retrait_securite":0.0,"Cagnotte_brute":720.0,"Nouveaux_packs":0,"Reste_cagnotte":720.0,"Gains_annuels":1020,"Cumul_apport":7700,"Cagnotte_nette":0,"Capital_total":8720.0,"Performance_globale":0.13,"Nb_packs":8},{"Annee":2026,"Mois":"2026-10","Compteur":8,"Capital_debut":8000,"Gains":160,"Apport_perso":100,"Achat_ponctuel":0,"Retrait_securite":0.0,"Cagnotte_brute":980.0,"Nouveaux_packs":0,"Reste_cagnotte":980.0,"Gains_annuels":1180,"Cumul_apport":7800,"Cagnotte_nette":0,"Capital_total":8980.0,"Performance_globale":0.15,"Nb_packs":8},{"Annee":2026,"Mois":"2026-11","Compteur":9,"Capital_debut":8000,"Gains":160,"Apport_perso":100,"Achat_ponctuel":0,"Retrait_securite":0.0,"Cagnotte_brute":1240.0,"Nouveaux_packs":1,"Reste_cagnotte":240.0,"Gains_annuels":1340,"Cumul_apport":7900,"Cagnotte_nette":1000,"Capital_total":9240.0,"Performance_globale":0.17,"Nb_packs":8},{"Annee":2026,"Mois":"2026-12","Compteur":10,"Capital_debut":9000,"Gains":180,"Apport_perso":100,"Achat_ponctuel":0,"Retrait_securite":0.0,"Cagnotte_brute":520.0,"Nouveaux_packs":0,"Reste_cagnotte":520.0,"Gains_annuels":1520,"Cumul_apport":8000,"Cagnotte_nette":0,"Capital_total":9520.0,"Performance_globale":0.19,"Nb_packs":9},{"Annee":2027,"Mois":"2027-01","Compteur":11,"Capital_debut":9000,"Gains":180,"Apport_perso":100,"Achat_ponctuel":0,"Retrait_securite":0.0,"Cagnotte_brute":800.0,"Nouveaux_packs":0,"Reste_cagnotte":800.0,"Gains_annuels":1700,"Cumul_apport":8100,"Cagnotte_nette":0,"Capital_total":9800.0,"Performance_globale":0.21,"Nb_packs":9},{"Annee":2027,"Mois":"2027-02","Compteur":12,"Capital_debut":9000,"Gains":180,"Apport_perso":100,"Achat_ponctuel":0,"Retrait_securite":0.0,"Cagnotte_brute":1080.0,"Nouveaux_packs":1,"Reste_cagnotte":80.0,"Gains_annuels":1880,"Cumul_apport":8200,"Cagnotte_nette":1000,"Capital_total":10080.0,"Performance_globale":0.23,"Nb_packs":9},{"Annee":2027,"Mois":"2027-03","Compteur":13,"Capital_debut":10000,"Gains":200,"Apport_perso":100,"Achat_ponctuel":0,"Retrait_securite":0.0,"Cagnotte_brute":380.0,"Nouveaux_packs":0,"Reste_cagnotte":380.0,"Gains_annuels":200,"Cumul_apport":8300,"Cagnotte_nette":0,"Capital_total":10380.0,"Performance_globale":0.25,"Nb_packs":10},{"Annee":2027,"Mois":"2027-04","Compteur":14,"Capital_debut":10000,"Gains":200,"Apport_perso":100,"Achat_ponctuel":0,"Retrait_securite":0.0,"Cagnotte_brute":680.0,"Nouveaux_packs":0,"Reste_cagnotte":680.0,"Gains_annuels":400,"Cumul_apport":8400,"Cagnotte_nette":0,"Capital_total":10680.0,"Performance_globale":0.27,"Nb_packs":10},{"Annee":2027,"Mois":"2027-05","Compteur":15,"Capital_debut":10000,"Gains":200,"Apport_perso":100,"Achat_ponctuel":0,"Retrait_securite":0.0,"Cagnotte_brute":980.0,"Nouveaux_packs":0,"Reste_cagnotte":980.0,"Gains_annuels":600,"Cumul_apport":8500,"Cagnotte_nette":0,"Capital_total":10980.0,"Performance_globale":0.29,"Nb_packs":10},{"Annee":2027,"Mois":"2027-06","Compteur":16,"Capital_debut":10000,"Gains":200,"Apport_perso":100,"Achat_ponctuel":0,"Retrait_securite":0.0,"Cagnotte_brute":1280.0,"Nouveaux_packs":1,"Reste_cagnotte":280.0,"Gains_annuels":800,"Cumul_apport":8600,"Cagnotte_nette":1000,"Capital_total":11280.0,"Performance_globale":0.31,"Nb_packs":10},{"Annee":2027,"Mois":"2027-07","Compteur":17,"Capital_debut":11000,"Gains":220,"Apport_perso":100,"Achat_ponctuel":0,"Retrait_securite":0.0,"Cagnotte_brute":600.0,"Nouveaux_packs":0,"Reste_cagnotte":600.0,"Gains_annuels":1020,"Cumul_apport":8700,"Cagnotte_nette":0,"Capital_total":11600.0,"Performance_globale":0.33,"Nb_packs":11},{"Annee":2027,"Mois":"2027-08","Compteur":18,"Capital_debut":11000,"Gains":220,"Apport_perso":100,"Achat_ponctuel":0,"Retrait_securite":0.0,"Cagnotte_brute":920.0,"Nouveaux_packs":0,"Reste_cagnotte":920.0,"Gains_annuels":1240,"Cumul_apport":8800,"Cagnotte_nette":0,"Capital_total":11920.0,"Performance_globale":0.35,"Nb_packs":11},{"Annee":2027,"Mois":"2027-09","Compteur":19,"Capital_debut":11000,"Gains":220,"Apport_perso":100,"Achat_ponctuel":0,"Retrait_securite":0.0,"Cagnotte_brute":1240.0,"Nouveaux_packs":1,"Reste_cagnotte":240.0,"Gains_annuels":1460,"Cumul_apport":8900,"Cagnotte_nette":1000,"Capital_total":12240.0,"Performance_globale":0.38,"Nb_packs":11},{"Annee":2027,"Mois":"2027-10","Compteur":20,"Capital_debut":12000,"Gains":240,"Apport_perso":100,"Achat_ponctuel":0,"Retrait_securite":0.0,"Cagnotte_brute":580.0,"Nouveaux_packs":0,"Reste_cagnotte":580.0,"Gains_annuels":1700,"Cumul_apport":9000,"Cagnotte_nette":0,"Capital_total":12580.0,"Performance_globale":0.4,"Nb_packs":12},{"Annee":2027,"Mois":"2027-11","Compteur":21,"Capital_debut":12000,"Gains":240,"Apport_perso":100,"Achat_ponctuel":0,"Retrait_securite":0.0,"Cagnotte_brute":920.0,"Nouveaux_packs":0,"Reste_cagnotte":920.0,"Gains_annuels":1940,"Cumul_apport":9100,"Cagnotte_nette":0,"Capital_total":12920.0,"Performance_globale":0.42,"Nb_packs":12},{"Annee":2027,"Mois":"2027-12","Compteur":22,"Capital_debut":12000,"Gains":240,"Apport_perso":100,"Achat_ponctuel":0,"Retrait_securite":0.0,"Cagnotte_brute":1260.0,"Nouveaux_packs":1,"Reste_cagnotte":260.0,"Gains_annuels":2180,"Cumul_apport":9200,"Cagnotte_nette":1000,"Capital_total":13260.0,"Performance_globale":0.44,"Nb_packs":12},{"Annee":2028,"Mois":"2028-01","Compteur":23,"Capital_debut":13000,"Gains":260,"Apport_perso":100,"Achat_ponctuel":0,"Retrait_securite":0.0,"Cagnotte_brute":620.0,"Nouveaux_packs":0,"Reste_cagnotte":620.0,"Gains_annuels":2440,"Cumul_apport":9300,"Cagnotte_nette":0,"Capital_total":13620.0,"Performance_globale":0.46,"Nb_packs":13},{"Annee":2028,"Mois":"2028-02","Compteur":24,"Capital_debut":13000,"Gains":260,"Apport_perso":100,"Achat_ponctuel":0,"Retrait_securite":0.0,"Cagnotte_brute":980.0,"Nouveaux_packs":0,"Reste_cagnotte":980.0,"Gains_annuels":2700,"Cumul_apport":9400,"Cagnotte_nette":0,"Capital_total":13980.0,"Performance_globale":0.49,"Nb_packs":13},{"Annee":2028,"Mois":"2028-03","Compteur":25,"Capital_debut":13000,"Gains":260,"Apport_perso":100,"Achat_ponctuel":0,"Retrait_securite":0.0,"Cagnotte_brute":1340.0,"Nouveaux_packs":1,"Reste_cagnotte":340.0,"Gains_annuels":260,"Cumul_apport":9500,"Cagnotte_nette":1000,"Capital_total":14340.0,"Performance_globale":0.51,"Nb_packs":13},{"Annee":2028,"Mois":"2028-04","Compteur":26,"Capital_debut":14000,"Gains":280,"Apport_perso":100,"Achat_ponctuel":0,"Retrait_securite":0.0,"Cagnotte_brute":720.0,"Nouveaux_packs":0,"Reste_cagnotte":720.0,"Gains_annuels":540,"Cumul_apport":9600,"Cagnotte_nette":0,"Capital_total":14720.0,"Performance_globale":0.53,"Nb_packs":14},{"Annee":2028,"Mois":"2028-05","Compteur":27,"Capital_debut":14000,"Gains":280,"Apport_perso":100,"Achat_ponctuel":0,"Retrait_securite":0.0,"Cagnotte_brute":1100.0,"Nouveaux_packs":1,"Reste_cagnotte":100.0,"Gains_annuels":820,"Cumul_apport":9700,"Cagnotte_nette":1000,"Capital_total":15100.0,"Performance_globale":0.56,"Nb_packs":14},{"Annee":2028,"Mois":"2028-06","Compteur":28,"Capital_debut":15000,"Gains":300,"Apport_perso":100,"Achat_ponctuel":0,"Retrait_securite":0.0,"Cagnotte_brute":500.0,"Nouveaux_packs":0,"Reste_cagnotte":500.0,"Gains_annuels":1120,"Cumul_apport":9800,"Cagnotte_nette":0,"Capital_total":15500.0,"Performance_globale":0.58,"Nb_packs":15},{"Annee":2028,"Mois":"2028-07","Compteur":29,"Capital_debut":15000,"Gains":300,"Apport_perso":100,"Achat_ponctuel":0,"Retrait_securite":0.0,"Cagnotte_brute":900.0,"Nouveaux_packs":0,"Reste_cagnotte":900.0,"Gains_annuels":1420,"Cumul_apport":9900,"Cagnotte_nette":0,"Capital_total":15900.0,"Performance_globale":0.61,"Nb_packs":15},{"Annee":2028,"Mois":"2028-08","Compteur":30,"Capital_debut":15000,"Gains":300,"Apport_perso":100,"Achat_ponctuel":0,"Retrait_securite":0.0,"Cagnotte_brute":1300.0,"Nouveaux_packs":1,"Reste_cagnotte":300.0,"Gains_annuels":1720,"Cumul_apport":10000,"Cagnotte_nette":1000,"Capital_total":16300.0,"Performance_globale":0.63,"Nb_packs":15},{"Annee":2028,"Mois":"2028-09","Compteur":31,"Capital_debut":16000,"Gains":320,"Apport_perso":100,"Achat_ponctuel":0,"Retrait_securite":0.0,"Cagnotte_brute":720.0,"Nouveaux_packs":0,"Reste_cagnotte":720.0,"Gains_annuels":2040,"Cumul_apport":10100,"Cagnotte_nette":0,"Capital_total":16720.0,"Performance_globale":0.66,"Nb_packs":16},{"Annee":2028,"Mois":"2028-10","Compteur":32,"Capital_debut":16000,"Gains":320,"Apport_perso":100,"Achat_ponctuel":0,"Retrait_securite":0.0,"Cagnotte_brute":1140.0,"Nouveaux_packs":1,"Reste_cagnotte":140.0,"Gains_annuels":2360,"Cumul_apport":10200,"Cagnotte_nette":1000,"Capital_total":17140.0,"Performance_globale":0.68,"Nb_packs":16},{"Annee":2028,"Mois":"2028-11","Compteur":33,"Capital_debut":17000,"Gains":340,"Apport_perso":100,"Achat_ponctuel":0,"Retrait_securite":0.0,"Cagnotte_brute":580.0,"Nouveaux_packs":0,"Reste_cagnotte":580.0,"Gains_annuels":2700,"Cumul_apport":10300,"Cagnotte_nette":0,"Capital_total":17580.0,"Performance_globale":0.71,"Nb_packs":17},{"Annee":2028,"Mois":"2028-12","Compteur":34,"Capital_debut":17000,"Gains":340,"Apport_perso":100,"Achat_ponctuel":0,"Retrait_securite":0.0,"Cagnotte_brute":1020.0,"Nouveaux_packs":1,"Reste_cagnotte":20.0,"Gains_annuels":3040,"Cumul_apport":10400,"Cagnotte_nette":1000,"Capital_total":18020.0,"Performance_globale":0.73,"Nb_packs":17},{"Annee":2029,"Mois":"2029-01","Compteur":35,"Capital_debut":18000,"Gains":360,"Apport_perso":100,"Achat_ponctuel":0,"Retrait_securite":0.0,"Cagnotte_brute":480.0,"Nouveaux_packs":0,"Reste_cagnotte":480.0,"Gains_annuels":3400,"Cumul_apport":10500,"Cagnotte_nette":0,"Capital_total":18480.0,"Performance_globale":0.76,"Nb_packs":18},{"Annee":2029,"Mois":"2029-02","Compteur":36,"Capital_debut":18000,"Gains":360,"Apport_perso":100,"Achat_ponctuel":0,"Retrait_securite":0.0,"Cagnotte_brute":940.0,"Nouveaux_packs":0,"Reste_cagnotte":940.0,"Gains_annuels":3760,"Cumul_apport":10600,"Cagnotte_nette":0,"Capital_total":18940.0,"Performance_globale":0.79,"Nb_packs":18},{"Annee":2029,"Mois":"2029-03","Compteur":37,"Capital_debut":18000,"Gains":360,"Apport_perso":100,"Achat_ponctuel":0,"Retrait_securite":0.0,"Cagnotte_brute":1400.0,"Nouveaux_packs":1,"Reste_cagnotte":400.0,"Gains_annuels":360,"Cumul_apport":10700,"Cagnotte_nette":1000,"Capital_total":19400.0,"Performance_globale":0.81,"Nb_packs":18},{"Annee":2029,"Mois":"2029-04","Compteur":38,"Capital_debut":19000,"Gains":380,"Apport_perso":100,"Achat_ponctuel":0,"Retrait_securite":0.0,"Cagnotte_brute":880.0,"Nouveaux_packs":0,"Reste_cagnotte":880.0,"Gains_annuels":740,"Cumul_apport":10800,"Cagnotte_nette":0,"Capital_total":19880.0,"Performance_globale":0.84,"Nb_packs":19},{"Annee":2029,"Mois":"2029-05","Compteur":39,"Capital_debut":19000,"Gains":380,"Apport_perso":100,"Achat_ponctuel":0,"Retrait_securite":0.0,"Cagnotte_brute":1360.0,"Nouveaux_packs":1,"Reste_cagnotte":360.0,"Gains_annuels":1120,"Cumul_apport":10900,"Cagnotte_nette":1000,"Capital_total":20360.0,"Performance_globale":0.87,"Nb_packs":19},{"Annee":2029,"Mois":"2029-06","Compteur":40,"Capital_debut":20000,"Gains":400,"Apport_perso":100,"Achat_ponctuel":0,"Retrait_securite":0.0,"Cagnotte_brute":860.0,"Nouveaux_packs":0,"Reste_cagnotte":860.0,"Gains_annuels":1520,"Cumul_apport":11000,"Cagnotte_nette":0,"Capital_total":20860.0,"Performance_globale":0.9,"Nb_packs":20},{"Annee":2029,"Mois":"2029-07","Compteur":41,"Capital_debut":20000,"Gains":400,"Apport_perso":100,"Achat_ponctuel":0,"Retrait_securite":0.0,"Cagnotte_brute":1360.0,"Nouveaux_packs":1,"Reste_cagnotte":360.0,"Gains_annuels":1920,"Cumul_apport":11100,"Cagnotte_nette":1000,"Capital_total":21360.0,"Performance_globale":0.92,"Nb_packs":20},{"Annee":2029,"Mois":"2029-08","Compteur":42,"Capital_debut":21000,"Gains":420,"Apport_perso":100,"Achat_ponctuel":0,"Retrait_securite":0.0,"Cagnotte_brute":880.0,"Nouveaux_packs":0,"Reste_cagnotte":880.0,"Gains_annuels":2340,"Cumul_apport":11200,"Cagnotte_nette":0,"Capital_total":21880.0,"Performance_globale":0.95,"Nb_packs":21},{"Annee":2029,"Mois":"2029-09","Compteur":43,"Capital_debut":21000,"Gains":420,"Apport_perso":100,"Achat_ponctuel":0,"Retrait_securite":0.0,"Cagnotte_brute":1400.0,"Nouveaux_packs":1,"Reste_cagnotte":400.0,"Gains_annuels":2760,"Cumul_apport":11300,"Cagnotte_nette":1000,"Capital_total":22400.0,"Performance_globale":0.98,"Nb_packs":21},{"Annee":2029,"Mois":"2029-10","Compteur":44,"Capital_debut":22000,"Gains":440,"Apport_perso":100,"Achat_ponctuel":0,"Retrait_securite":0.0,"Cagnotte_brute":940.0,"Nouveaux_packs":0,"Reste_cagnotte":940.0,"Gains_annuels":3200,"Cumul_apport":11400,"Cagnotte_nette":0,"Capital_total":22940.0,"Performance_globale":1.01,"Nb_packs":22},{"Annee":2029,"Mois":"2029-11","Compteur":45,"Capital_debut":22000,"Gains":440,"Apport_perso":100,"Achat_ponctuel":0,"Retrait_securite":0.0,"Cagnotte_brute":1480.0,"Nouveaux_packs":1,"Reste_cagnotte":480.0,"Gains_annuels":3640,"Cumul_apport":11500,"Cagnotte_nette":1000,"Capital_total":23480.0,"Performance_globale":1.04,"Nb_packs":22},{"Annee":2029,"Mois":"2029-12","Compteur":46,"Capital_debut":23000,"Gains":460,"Apport_perso":100,"Achat_ponctuel":0,"Retrait_securite":0.0,"Cagnotte_brute":1040.0,"Nouveaux_packs":1,"Reste_cagnotte":40.0,"Gains_annuels":4100,"Cumul_apport":11600,"Cagnotte_nette":1000,"Capital_total":24040.0,"Performance_globale":1.07,"Nb_packs":23},{"Annee":2030,"Mois":"2030-01","Compteur":47,"Capital_debut":24000,"Gains":480,"Apport_perso":100,"Achat_ponctuel":0,"Retrait_securite":0.0,"Cagnotte_brute":620.0,"Nouveaux_packs":0,"Reste_cagnotte":620.0,"Gains_annuels":4580,"Cumul_apport":11700,"Cagnotte_nette":0,"Capital_total":24620.0,"Performance_globale":1.1,"Nb_packs":24},{"Annee":2030,"Mois":"2030-02","Compteur":48,"Capital_debut":24000,"Gains":480,"Apport_perso":100,"Achat_ponctuel":0,"Retrait_securite":0.0,"Cagnotte_brute":1200.0,"Nouveaux_packs":1,"Reste_cagnotte":200.0,"Gains_annuels":5060,"Cumul_apport":11800,"Cagnotte_nette":1000,"Capital_total":25200.0,"Performance_globale":1.14,"Nb_packs":24},{"Annee":2030,"Mois":"2030-03","Compteur":49,"Capital_debut":25000,"Gains":500,"Apport_perso":100,"Achat_ponctuel":0,"Retrait_securite":0.0,"Cagnotte_brute":800.0,"Nouveaux_packs":0,"Reste_cagnotte":800.0,"Gains_annuels":500,"Cumul_apport":11900,"Cagnotte_nette":0,"Capital_total":25800.0,"Performance_globale":1.17,"Nb_packs":25},{"Annee":2030,"Mois":"2030-04","Compteur":50,"Capital_debut":25000,"Gains":500,"Apport_perso":100,"Achat_ponctuel":0,"Retrait_securite":0.0,"Cagnotte_brute":1400.0,"Nouveaux_packs":1,"Reste_cagnotte":400.0,"Gains_annuels":1000,"Cumul_apport":12000,"Cagnotte_nette":1000,"Capital_total":26400.0,"Performance_globale":1.2,"Nb_packs":25},{"Annee":2030,"Mois":"2030-05","Compteur":51,"Capital_debut":26000,"Gains":520,"Apport_perso":100,"Achat_ponctuel":0,"Retrait_securite":0.0,"Cagnotte_brute":1020.0,"Nouveaux_packs":1,"Reste_cagnotte":20.0,"Gains_annuels":1520,"Cumul_apport":12100,"Cagnotte_nette":1000,"Capital_total":27020.0,"Performance_globale":1.23,"Nb_packs":26},{"Annee":2030,"Mois":"2030-06","Compteur":52,"Capital_debut":27000,"Gains":540,"Apport_perso":100,"Achat_ponctuel":0,"Retrait_securite":0.0,"Cagnotte_brute":660.0,"Nouveaux_packs":0,"Reste_cagnotte":660.0,"Gains_annuels":2060,"Cumul_apport":12200,"Cagnotte_nette":0,"Capital_total":27660.0,"Performance_globale":1.27,"Nb_packs":27},{"Annee":2030,"Mois":"2030-07","Compteur":53,"Capital_debut":27000,"Gains":540,"Apport_perso":100,"Achat_ponctuel":0,"Retrait_securite":0.0,"Cagnotte_brute":1300.0,"Nouveaux_packs":1,"Reste_cagnotte":300.0,"Gains_annuels":2600,"Cumul_apport":12300,"Cagnotte_nette":1000,"Capital_total":28300.0,"Performance_globale":1.3,"Nb_packs":27},{"Annee":2030,"Mois":"2030-08","Compteur":54,"Capital_debut":28000,"Gains":560,"Apport_perso":100,"Achat_ponctuel":0,"Retrait_securite":0.0,"Cagnotte_brute":960.0,"Nouveaux_packs":0,"Reste_cagnotte":960.0,"Gains_annuels":3160,"Cumul_apport":12400,"Cagnotte_nette":0,"Capital_total":28960.0,"Performance_globale":1.34,"Nb_packs":28},{"Annee":2030,"Mois":"2030-09","Compteur":55,"Capital_debut":28000,"Gains":560,"Apport_perso":100,"Achat_ponctuel":0,"Retrait_securite":0.0,"Cagnotte_brute":1620.0,"Nouveaux_packs":1,"Reste_cagnotte":620.0,"Gains_annuels":3720,"Cumul_apport":12500,"Cagnotte_nette":1000,"Capital_total":29620.0,"Performance_globale":1.37,"Nb_packs":28},{"Annee":2030,"Mois":"2030-10","Compteur":56,"Capital_debut":29000,"Gains":580,"Apport_perso":100,"Achat_ponctuel":0,"Retrait_securite":0.0,"Cagnotte_brute":1300.0,"Nouveaux_packs":1,"Reste_cagnotte":300.0,"Gains_annuels":4300,"Cumul_apport":12600,"Cagnotte_nette":1000,"Capital_total":30300.0,"Performance_globale":1.4,"Nb_packs":29},{"Annee":2030,"Mois":"2030-11","Compteur":57,"Capital_debut":30000,"Gains":600,"Apport_perso":100,"Achat_ponctuel":0,"Retrait_securite":0.0,"Cagnotte_brute":1000.0,"Nouveaux_packs":1,"Reste_cagnotte":0.0,"Gains_annuels":4900,"Cumul_apport":12700,"Cagnotte_nette":1000,"Capital_total":31000.0,"Performance_globale":1.44,"Nb_packs":30},{"Annee":2030,"Mois":"2030-12","Compteur":58,"Capital_debut":31000,"Gains":620,"Apport_perso":100,"Achat_ponctuel":0,"Retrait_securite":0.0,"Cagnotte_brute":720.0,"Nouveaux_packs":0,"Reste_cagnotte":720.0,"Gains_annuels":5520,"Cumul_apport":12800,"Cagnotte_nette":0,"Capital_total":31720.0,"Performance_globale":1.48,"Nb_packs":31},{"Annee":2031,"Mois":"2031-01","Compteur":59,"Capital_debut":31000,"Gains":620,"Apport_perso":100,"Achat_ponctuel":0,"Retrait_securite":0.0,"Cagnotte_brute":1440.0,"Nouveaux_packs":1,"Reste_cagnotte":440.0,"Gains_annuels":6140,"Cumul_apport":12900,"Cagnotte_nette":1000,"Capital_total":32440.0,"Performance_globale":1.51,"Nb_packs":31},{"Annee":2031,"Mois":"2031-02","Compteur":60,"Capital_debut":32000,"Gains":640,"Apport_perso":100,"Achat_ponctuel":0,"Retrait_securite":0.0,"Cagnotte_brute":1180.0,"Nouveaux_packs":1,"Reste_cagnotte":180.0,"Gains_annuels":6780,"Cumul_apport":13000,"Cagnotte_nette":1000,"Capital_total":33180.0,"Performance_globale":1.55,"Nb_packs":32},{"Annee":2031,"Mois":"2031-03","Compteur":61,"Capital_debut":33000,"Gains":660,"Apport_perso":100,"Achat_ponctuel":0,"Retrait_securite":0.0,"Cagnotte_brute":940.0,"Nouveaux_packs":0,"Reste_cagnotte":940.0,"Gains_annuels":660,"Cumul_apport":13100,"Cagnotte_nette":0,"Capital_total":33940.0,"Performance_globale":1.59,"Nb_packs":33},{"Annee":2031,"Mois":"2031-04","Compteur":62,"Capital_debut":33000,"Gains":660,"Apport_perso":100,"Achat_ponctuel":0,"Retrait_securite":0.0,"Cagnotte_brute":1700.0,"Nouveaux_packs":1,"Reste_cagnotte":700.0,"Gains_annuels":1320,"Cumul_apport":13200,"Cagnotte_nette":1000,"Capital_total":34700.0,"Performance_globale":1.63,"Nb_packs":33},{"Annee":2031,"Mois":"2031-05","Compteur":63,"Capital_debut":34000,"Gains":680,"Apport_perso":100,"Achat_ponctuel":0,"Retrait_securite":0.0,"Cagnotte_brute":1480.0,"Nouveaux_packs":1,"Reste_cagnotte":480.0,"Gains_annuels":2000,"Cumul_apport":13300,"Cagnotte_nette":1000,"Capital_total":35480.0,"Performance_globale":1.67,"Nb_packs":34},{"Annee":2031,"Mois":"2031-06","Compteur":64,"Capital_debut":35000,"Gains":700,"Apport_perso":100,"Achat_ponctuel":0,"Retrait_securite":0.0,"Cagnotte_brute":1280.0,"Nouveaux_packs":1,"Reste_cagnotte":280.0,"Gains_annuels":2700,"Cumul_apport":13400,"Cagnotte_nette":1000,"Capital_total":36280.0,"Performance_globale":1.71,"Nb_packs":35},{"Annee":2031,"Mois":"2031-07","Compteur":65,"Capital_debut":36000,"Gains":720,"Apport_perso":100,"Achat_ponctuel":0,"Retrait_securite":0.0,"Cagnotte_brute":1100.0,"Nouveaux_packs":1,"Reste_cagnotte":100.0,"Gains_annuels":3420,"Cumul_apport":13500,"Cagnotte_nette":1000,"Capital_total":37100.0,"Performance_globale":1.75,"Nb_packs":36},{"Annee":2031,"Mois":"2031-08","Compteur":66,"Capital_debut":37000,"Gains":740,"Apport_perso":100,"Achat_ponctuel":0,"Retrait_securite":0.0,"Cagnotte_brute":940.0,"Nouveaux_packs":0,"Reste_cagnotte":940.0,"Gains_annuels":4160,"Cumul_apport":13600,"Cagnotte_nette":0,"Capital_total":37940.0,"Performance_globale":1.79,"Nb_packs":37},{"Annee":2031,"Mois":"2031-09","Compteur":67,"Capital_debut":37000,"Gains":740,"Apport_perso":100,"Achat_ponctuel":0,"Retrait_securite":0.0,"Cagnotte_brute":1780.0,"Nouveaux_packs":1,"Reste_cagnotte":780.0,"Gains_annuels":4900,"Cumul_apport":13700,"Cagnotte_nette":1000,"Capital_total":38780.0,"Performance_globale":1.83,"Nb_packs":37},{"Annee":2031,"Mois":"2031-10","Compteur":68,"Capital_debut":38000,"Gains":760,"Apport_perso":100,"Achat_ponctuel":0,"Retrait_securite":0.0,"Cagnotte_brute":1640.0,"Nouveaux_packs":1,"Reste_cagnotte":640.0,"Gains_annuels":5660,"Cumul_apport":13800,"Cagnotte_nette":1000,"Capital_total":39640.0,"Performance_globale":1.87,"Nb_packs":38},{"Annee":2031,"Mois":"2031-11","Compteur":69,"Capital_debut":39000,"Gains":780,"Apport_perso":100,"Achat_ponctuel":0,"Retrait_securite":0.0,"Cagnotte_brute":1520.0,"Nouveaux_packs":1,"Reste_cagnotte":520.0,"Gains_annuels":6440,"Cumul_apport":13900,"Cagnotte_nette":1000,"Capital_total":40520.0,"Performance_globale":1.92,"Nb_packs":39},{"Annee":2031,"Mois":"2031-12","Compteur":70,"Capital_debut":40000,"Gains":800,"Apport_perso":100,"Achat_ponctuel":0,"Retrait_securite":0.0,"Cagnotte_brute":1420.0,"Nouveaux_packs":1,"Reste_cagnotte":420.0,"Gains_annuels":7240,"Cumul_apport":14000,"Cagnotte_nette":1000,"Capital_total":41420.0,"Performance_globale":1.96,"Nb_packs":40}];

const fmt = (n) => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n);
const fmtPct = (n) => (n * 100).toFixed(1) + "%";

export default function ECADashboard() {
  const [data, setData] = useState(() => RAW_DATA.map(d => ({ ...d })));
  const [activeTab, setActiveTab] = useState("overview");
  const [editingRow, setEditingRow] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [gainRate, setGainRate] = useState(2);
  const [selectedYear, setSelectedYear] = useState("all");

  const years = useMemo(() => [...new Set(data.map(d => d.Annee))], [data]);

  const recomputedData = useMemo(() => {
    const rate = gainRate / 100;
    let result = [];
    let prevCapital = data[0].Capital_debut;
    let cagnotteBrute = 0;
    let cumul = data[0].Cumul_apport - data[0].Apport_perso;
    let gainsAnnuels = 0;
    let prevAnnee = data[0].Annee;
    let cagnotte_nette_total = 0;
    for (let i = 0; i < data.length; i++) {
      const row = { ...data[i] };
      const isNewYear = row.Annee !== prevAnnee;
      if (isNewYear) { gainsAnnuels = 0; prevAnnee = row.Annee; }
      const gains = Math.round(prevCapital * rate);
      cagnotteBrute += gains + row.Apport_perso;
      gainsAnnuels += gains;
      cumul += row.Apport_perso;
      const nouveaux_packs = Math.floor(cagnotteBrute / 1000);
      const reste = cagnotteBrute - nouveaux_packs * 1000;
      cagnotte_nette_total += nouveaux_packs * 1000;
      const newCapital = prevCapital + nouveaux_packs * 1000;
      const capitalTotal = newCapital + reste;
      const perf = cumul > 0 ? (capitalTotal - cumul) / cumul : 0;
      row.Gains = gains; row.Cagnotte_brute = Math.round(cagnotteBrute);
      row.Nouveaux_packs = nouveaux_packs; row.Reste_cagnotte = Math.round(reste);
      row.Gains_annuels = gainsAnnuels; row.Cumul_apport = cumul;
      row.Cagnotte_nette = cagnotte_nette_total; row.Capital_total = capitalTotal;
      row.Performance_globale = Math.round(perf * 1000) / 1000; row.Nb_packs = newCapital / 1000;
      if (nouveaux_packs > 0) { cagnotteBrute = reste; prevCapital = newCapital; }
      result.push(row);
    }
    return result;
  }, [gainRate, data]);

  const displayData = gainRate !== 2 ? recomputedData : data;
  const filteredData = selectedYear === "all" ? displayData : displayData.filter(d => d.Annee === Number(selectedYear));

  const lastRow = displayData[displayData.length - 1];
  const firstRow = displayData[0];

  const startEdit = (row, idx) => { setEditingRow(idx); setEditValues({ Apport_perso: row.Apport_perso, Achat_ponctuel: row.Achat_ponctuel }); };
  const saveEdit = (idx) => {
    setData(prev => { const next = [...prev]; next[idx] = { ...next[idx], Apport_perso: Number(editValues.Apport_perso), Achat_ponctuel: Number(editValues.Achat_ponctuel) }; return next; });
    setEditingRow(null);
  };

  const chartData = displayData.filter((_, i) => i % 2 === 0 || i === displayData.length - 1).map(d => ({
    mois: d.Mois.slice(2), capital: Math.round(d.Capital_total), apports: d.Cumul_apport,
    gains: Math.round(d.Cagnotte_nette + d.Reste_cagnotte), perf: Math.round(d.Performance_globale * 100 * 10) / 10,
    packs: d.Nb_packs, mensuel: d.Gains,
  }));

  const annualData = years.map(y => {
    const rows = displayData.filter(d => d.Annee === y);
    const last = rows[rows.length - 1];
    return { annee: y, capital_fin: Math.round(last.Capital_total), gains_annuels: last.Gains_annuels, apports: rows.reduce((s, r) => s + r.Apport_perso, 0), packs: last.Nb_packs };
  });

  const Tip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: "#0f1923", border: "1px solid #1e3a5f", borderRadius: 8, padding: "10px 14px", fontSize: 12 }}>
        <p style={{ color: "#7dd3fc", marginBottom: 4, fontWeight: 700 }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color, margin: "2px 0" }}>{p.name}: <strong>{fmt(p.value)}{p.name === "Perf. %" ? "%" : " €"}</strong></p>
        ))}
      </div>
    );
  };

  const tabs = [{ id: "overview", label: "📊 Vue d'ensemble" }, { id: "charts", label: "📈 Graphiques" }, { id: "table", label: "📋 Tableau & Saisie" }, { id: "settings", label: "⚙️ Paramètres" }];

  return (
    <div style={{ background: "#060d14", minHeight: "100vh", color: "#e2e8f0", fontFamily: "'Segoe UI', system-ui, sans-serif", fontSize: 14 }}>
      <div style={{ background: "linear-gradient(135deg, #0a1628 0%, #0d2137 100%)", borderBottom: "1px solid #1e3a5f", padding: "18px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#38bdf8", letterSpacing: 1 }}>ECA — Tableau de Bord Investissement</div>
          <div style={{ color: "#64748b", fontSize: 11, marginTop: 2 }}>{firstRow?.Mois} → {lastRow?.Mois} · {displayData.length} mois · Taux: <span style={{ color: "#38bdf8" }}>{gainRate}%/mois</span></div>
        </div>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          {[
            { label: "Capital final", value: fmt(lastRow.Capital_total) + " €", color: "#38bdf8" },
            { label: "Performance", value: fmtPct(lastRow.Performance_globale), color: "#4ade80" },
            { label: "Nb Packs", value: lastRow.Nb_packs, color: "#f59e0b" },
            { label: "Gains/mois", value: fmt(lastRow.Gains) + " €", color: "#f472b6" },
          ].map(kpi => (
            <div key={kpi.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>{kpi.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 0, background: "#0a1628", borderBottom: "1px solid #1e3a5f", padding: "0 24px", overflowX: "auto" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ background: "none", border: "none", color: activeTab === t.id ? "#38bdf8" : "#64748b", fontWeight: 700, fontSize: 12, padding: "13px 18px", cursor: "pointer", borderBottom: activeTab === t.id ? "2px solid #38bdf8" : "2px solid transparent", whiteSpace: "nowrap" }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: "20px 24px" }}>
        {activeTab === "overview" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
              {[
                { label: "Capital Total", value: fmt(lastRow.Capital_total) + " €", sub: `Départ: ${fmt(firstRow.Capital_debut)} €`, color: "#38bdf8", icon: "💰" },
                { label: "Performance Globale", value: fmtPct(lastRow.Performance_globale), sub: `Gains cumulés: ${fmt(lastRow.Cagnotte_nette + lastRow.Reste_cagnotte)} €`, color: "#4ade80", icon: "📈" },
                { label: "Gains Mensuels", value: fmt(lastRow.Gains) + " €", sub: `${gainRate}% × ${fmt(lastRow.Capital_debut)} €`, color: "#f59e0b", icon: "💸" },
                { label: "Apports Versés", value: fmt(lastRow.Cumul_apport) + " €", sub: `${displayData.length} mois cumulés`, color: "#a78bfa", icon: "🏦" },
              ].map(kpi => (
                <div key={kpi.label} style={{ background: "linear-gradient(135deg, #0f1923, #0d2137)", border: "1px solid #1e3a5f", borderRadius: 10, padding: "16px 18px" }}>
                  <div style={{ fontSize: 24, marginBottom: 4 }}>{kpi.icon}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{kpi.label}</div>
                  <div style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>{kpi.sub}</div>
                </div>
              ))}
            </div>
            <div style={{ background: "#0f1923", border: "1px solid #1e3a5f", borderRadius: 10, padding: "18px 16px 8px", marginBottom: 16 }}>
              <div style={{ fontWeight: 700, color: "#e2e8f0", marginBottom: 14, fontSize: 14 }}>Évolution du Capital Total</div>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="gC" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} /><stop offset="95%" stopColor="#38bdf8" stopOpacity={0} /></linearGradient>
                    <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#a78bfa" stopOpacity={0.2} /><stop offset="95%" stopColor="#a78bfa" stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                  <XAxis dataKey="mois" stroke="#475569" tick={{ fontSize: 9 }} interval={9} />
                  <YAxis stroke="#475569" tick={{ fontSize: 9 }} tickFormatter={v => (v/1000).toFixed(0) + "k"} />
                  <Tooltip content={<Tip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="capital" name="Capital" stroke="#38bdf8" fill="url(#gC)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="apports" name="Apports" stroke="#a78bfa" fill="url(#gA)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: "#0f1923", border: "1px solid #1e3a5f", borderRadius: 10, padding: "18px 16px 8px" }}>
              <div style={{ fontWeight: 700, color: "#e2e8f0", marginBottom: 14, fontSize: 14 }}>Gains annuels vs Apports</div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={annualData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                  <XAxis dataKey="annee" stroke="#475569" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#475569" tick={{ fontSize: 9 }} tickFormatter={v => (v/1000).toFixed(0) + "k"} />
                  <Tooltip content={<Tip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="gains_annuels" name="Gains/an" fill="#4ade80" radius={[3,3,0,0]} />
                  <Bar dataKey="apports" name="Apports" fill="#a78bfa" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === "charts" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {[
              { title: "Performance Globale (%)", height: 210, chart: <LineChart data={chartData}><CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" /><XAxis dataKey="mois" stroke="#475569" tick={{ fontSize: 9 }} interval={9} /><YAxis stroke="#475569" tick={{ fontSize: 9 }} tickFormatter={v => v + "%"} /><Tooltip content={<Tip />} /><ReferenceLine y={100} stroke="#f59e0b" strokeDasharray="4 4" /><Line type="monotone" dataKey="perf" name="Perf. %" stroke="#4ade80" strokeWidth={2} dot={false} /></LineChart> },
              { title: "Nombre de Packs", height: 210, chart: <AreaChart data={chartData}><defs><linearGradient id="gP" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} /><stop offset="95%" stopColor="#f59e0b" stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" /><XAxis dataKey="mois" stroke="#475569" tick={{ fontSize: 9 }} interval={9} /><YAxis stroke="#475569" tick={{ fontSize: 9 }} /><Tooltip content={<Tip />} /><Area type="monotone" dataKey="packs" name="Packs" stroke="#f59e0b" fill="url(#gP)" strokeWidth={2} dot={false} /></AreaChart> },
              { title: "Gains Mensuels (€)", height: 210, chart: <AreaChart data={chartData}><defs><linearGradient id="gM" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f472b6" stopOpacity={0.3} /><stop offset="95%" stopColor="#f472b6" stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" /><XAxis dataKey="mois" stroke="#475569" tick={{ fontSize: 9 }} interval={9} /><YAxis stroke="#475569" tick={{ fontSize: 9 }} tickFormatter={v => (v/1000).toFixed(0) + "k"} /><Tooltip content={<Tip />} /><Area type="monotone" dataKey="mensuel" name="Gains/mois" stroke="#f472b6" fill="url(#gM)" strokeWidth={2} dot={false} /></AreaChart> },
              { title: "Capital vs Apports", height: 210, chart: <LineChart data={chartData}><CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" /><XAxis dataKey="mois" stroke="#475569" tick={{ fontSize: 9 }} interval={9} /><YAxis stroke="#475569" tick={{ fontSize: 9 }} tickFormatter={v => (v/1000).toFixed(0) + "k"} /><Tooltip content={<Tip />} /><Legend wrapperStyle={{ fontSize: 10 }} /><Line type="monotone" dataKey="capital" name="Capital" stroke="#38bdf8" strokeWidth={2} dot={false} /><Line type="monotone" dataKey="apports" name="Apports" stroke="#a78bfa" strokeWidth={2} dot={false} strokeDasharray="5 5" /></LineChart> },
            ].map(({ title, chart, height }) => (
              <div key={title} style={{ background: "#0f1923", border: "1px solid #1e3a5f", borderRadius: 10, padding: "14px 14px 6px" }}>
                <div style={{ fontWeight: 700, color: "#94a3b8", marginBottom: 10, fontSize: 12 }}>{title}</div>
                <ResponsiveContainer width="100%" height={height}>{chart}</ResponsiveContainer>
              </div>
            ))}
          </div>
        )}

        {activeTab === "table" && (
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 14, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ color: "#64748b", fontSize: 12 }}>Année :</span>
              {["all", ...years].map(y => (
                <button key={y} onClick={() => setSelectedYear(y.toString())}
                  style={{ background: selectedYear === y.toString() ? "#1e3a5f" : "transparent", border: "1px solid #1e3a5f", borderRadius: 6, color: selectedYear === y.toString() ? "#38bdf8" : "#64748b", padding: "3px 10px", fontSize: 11, cursor: "pointer", fontWeight: selectedYear === y.toString() ? 700 : 400 }}>
                  {y === "all" ? "Tout" : y}
                </button>
              ))}
              <span style={{ color: "#475569", fontSize: 11, marginLeft: 8 }}>{filteredData.length} lignes · Cliquez sur ✏️ pour modifier les apports</span>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead>
                  <tr style={{ background: "#0a1628", borderBottom: "2px solid #1e3a5f" }}>
                    {["Mois", "Capital Début", "Gains", "Apport ✏️", "Cagnotte Brute", "Nvx Packs", "Cap. Nette", "Capital Total", "Perf.", "Packs", "Edit"].map(h => (
                      <th key={h} style={{ padding: "9px 10px", textAlign: h === "Mois" ? "left" : "right", color: "#64748b", fontWeight: 700, whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((row, i) => {
                    const globalIdx = data.findIndex(d => d.Mois === row.Mois);
                    const isEditing = editingRow === globalIdx;
                    return (
                      <tr key={row.Mois} style={{ borderBottom: "1px solid #0a1220", background: i % 2 === 0 ? "#0a1220" : "#0b1828" }}
                        onMouseEnter={e => e.currentTarget.style.background = "#0d2137"}
                        onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? "#0a1220" : "#0b1828"}>
                        <td style={{ padding: "7px 10px", color: "#94a3b8", fontWeight: 600 }}>{row.Mois}</td>
                        <td style={{ padding: "7px 10px", textAlign: "right" }}>{fmt(row.Capital_debut)} €</td>
                        <td style={{ padding: "7px 10px", textAlign: "right", color: "#4ade80" }}>+{fmt(row.Gains)} €</td>
                        <td style={{ padding: "7px 10px", textAlign: "right" }}>
                          {isEditing ? (
                            <input type="number" value={editValues.Apport_perso} onChange={e => setEditValues(p => ({ ...p, Apport_perso: e.target.value }))}
                              style={{ width: 65, background: "#1e3a5f", border: "1px solid #38bdf8", borderRadius: 4, color: "#e2e8f0", padding: "2px 5px", textAlign: "right", fontSize: 11 }} />
                          ) : <span style={{ color: "#a78bfa" }}>{fmt(row.Apport_perso)} €</span>}
                        </td>
                        <td style={{ padding: "7px 10px", textAlign: "right" }}>{fmt(row.Cagnotte_brute)} €</td>
                        <td style={{ padding: "7px 10px", textAlign: "right", color: row.Nouveaux_packs > 0 ? "#f59e0b" : "#475569", fontWeight: row.Nouveaux_packs > 0 ? 700 : 400 }}>{row.Nouveaux_packs > 0 ? "+" + row.Nouveaux_packs : "—"}</td>
                        <td style={{ padding: "7px 10px", textAlign: "right", color: "#38bdf8" }}>{fmt(row.Cagnotte_nette)} €</td>
                        <td style={{ padding: "7px 10px", textAlign: "right", fontWeight: 700 }}>{fmt(row.Capital_total)} €</td>
                        <td style={{ padding: "7px 10px", textAlign: "right", color: row.Performance_globale >= 1 ? "#f59e0b" : "#4ade80" }}>{fmtPct(row.Performance_globale)}</td>
                        <td style={{ padding: "7px 10px", textAlign: "right" }}>{row.Nb_packs}</td>
                        <td style={{ padding: "7px 10px", textAlign: "right" }}>
                          {isEditing ? (
                            <span style={{ display: "flex", gap: 3, justifyContent: "flex-end" }}>
                              <button onClick={() => saveEdit(globalIdx)} style={{ background: "#065f46", border: "none", borderRadius: 3, color: "#4ade80", padding: "2px 7px", cursor: "pointer", fontSize: 11 }}>✓</button>
                              <button onClick={() => setEditingRow(null)} style={{ background: "#7f1d1d", border: "none", borderRadius: 3, color: "#f87171", padding: "2px 7px", cursor: "pointer", fontSize: 11 }}>✗</button>
                            </span>
                          ) : (
                            <button onClick={() => startEdit(row, globalIdx)} style={{ background: "#1e3a5f", border: "none", borderRadius: 4, color: "#38bdf8", padding: "2px 8px", cursor: "pointer", fontSize: 11 }}>✏️</button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div style={{ maxWidth: 520 }}>
            <div style={{ background: "#0f1923", border: "1px solid #1e3a5f", borderRadius: 10, padding: 22, marginBottom: 16 }}>
              <div style={{ fontWeight: 700, color: "#e2e8f0", marginBottom: 18, fontSize: 15 }}>⚙️ Taux de Gain Mensuel</div>
              <label style={{ color: "#94a3b8", fontSize: 13, display: "block", marginBottom: 10, fontWeight: 600 }}>
                Taux actuel : <span style={{ color: "#38bdf8", fontSize: 22, fontWeight: 800 }}>{gainRate}%</span> / mois
              </label>
              <input type="range" min="1" max="5" step="0.5" value={gainRate} onChange={e => setGainRate(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#38bdf8", cursor: "pointer", height: 6 }} />
              <div style={{ display: "flex", justifyContent: "space-between", color: "#475569", fontSize: 10, marginTop: 4 }}>
                {[1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map(v => <span key={v}>{v}%</span>)}
              </div>
              <div style={{ marginTop: 16, background: "#060d14", border: "1px solid #1e3a5f", borderRadius: 8, overflow: "hidden" }}>
                <div style={{ padding: "8px 14px", background: "#0a1628", color: "#64748b", fontSize: 11, fontWeight: 700 }}>COMPARAISON DES TAUX</div>
                {[1, 1.5, 2, 2.5, 3, 4, 5].map(rate => {
                  const base = data[0].Capital_debut;
                  const months = displayData.length;
                  const estCapital = base * Math.pow(1 + rate / 100, months);
                  const isActive = rate === gainRate;
                  return (
                    <div key={rate} onClick={() => setGainRate(rate)} style={{ display: "flex", justifyContent: "space-between", padding: "8px 14px", borderBottom: "1px solid #1e3a5f", color: isActive ? "#38bdf8" : "#64748b", fontWeight: isActive ? 700 : 400, background: isActive ? "#0d2137" : "transparent", cursor: "pointer", transition: "background 0.15s" }}>
                      <span>{rate}%/mois</span>
                      <span>≈ {fmt(estCapital)} €</span>
                      <span style={{ color: isActive ? "#4ade80" : "#475569" }}>+{(((estCapital - base) / base) * 100).toFixed(0)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ background: "#0f1923", border: "1px solid #1e3a5f", borderRadius: 10, padding: 22 }}>
              <div style={{ fontWeight: 700, color: "#e2e8f0", marginBottom: 14, fontSize: 15 }}>📋 Récapitulatif Simulation</div>
              {[
                { label: "Période", value: `${firstRow?.Mois} → ${lastRow?.Mois}` },
                { label: "Durée", value: `${displayData.length} mois` },
                { label: "Capital initial", value: `${fmt(firstRow?.Capital_debut)} €` },
                { label: "Capital final", value: `${fmt(lastRow?.Capital_total)} €`, hi: true },
                { label: "Total apports", value: `${fmt(lastRow?.Cumul_apport)} €` },
                { label: "Gains générés", value: `${fmt(lastRow?.Cagnotte_nette + lastRow?.Reste_cagnotte)} €`, hi: true },
                { label: "Performance", value: fmtPct(lastRow?.Performance_globale), hi: true },
                { label: "Nb packs final", value: `${lastRow?.Nb_packs} packs` },
              ].map(({ label, value, hi }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #0a1220" }}>
                  <span style={{ color: "#64748b" }}>{label}</span>
                  <span style={{ fontWeight: 700, color: hi ? "#4ade80" : "#e2e8f0" }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
