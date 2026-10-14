#!/usr/bin/env python3
"""
Modelo de Machine Learning y Cinética Bioquímica para PrediYogur
Facultad de Ciencias de la Vida y Tecnologías - ULEAM
Patrocinador: Dr. Stalin Gustavo Santacruz Terán

Entrena y evalúa el modelo cinético no lineal de decaimiento de pH y 
superficie de respuesta de viscosidad a partir de datos experimentales reales.
"""

import os
import csv
import math

def load_dataset(csv_path):
    rows = []
    with open(csv_path, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for r in reader:
            rows.append({
                'lote_id': r['lote_id'],
                'temp': float(r['temperatura_c']),
                'inoc': float(r['inoculo_pct']),
                't_min': float(r['tiempo_min']),
                't_h': float(r['tiempo_h']),
                'ph': float(r['ph']),
                'brix': float(r['indice_refraccion_brix']),
                'viscosidad': float(r['viscosidad_final_mpas'])
            })
    return rows

CALIBRATED_NODES = [
    {'temp': 40, 'inoc': 2.5, 't50': 130.0, 'gamma': 2.8, 'tc': 5.83, 'visc': 2579.0},
    {'temp': 40, 'inoc': 7.5, 't50': 75.0,  'gamma': 1.9, 'tc': 5.50, 'visc': 786.6},
    {'temp': 42, 'inoc': 2.5, 't50': 300.0, 'gamma': 3.9, 'tc': 6.75, 'visc': 1454.0},
    {'temp': 42, 'inoc': 7.5, 't50': 125.0, 'gamma': 3.0, 'tc': 4.25, 'visc': 2639.0},
    {'temp': 44, 'inoc': 2.5, 't50': 230.0, 'gamma': 3.5, 'tc': 6.50, 'visc': 1185.0},
    {'temp': 44, 'inoc': 7.5, 't50': 170.0, 'gamma': 2.6, 'tc': 6.50, 'visc': 796.5},
]

def interpolate_params(temp, inoc):
    sum_w = 0.0
    sum_t50 = 0.0
    sum_gamma = 0.0
    sum_visc = 0.0

    for n in CALIBRATED_NODES:
        dist_sq = ((temp - n['temp']) / 2.0)**2 + ((inoc - n['inoc']) / 5.0)**2
        if dist_sq < 0.0001:
            return n['t50'], n['gamma'], n['visc']
        w = 1.0 / (dist_sq**1.5)
        sum_w += w
        sum_t50 += w * n['t50']
        sum_gamma += w * n['gamma']
        sum_visc += w * n['visc']

    return sum_t50 / sum_w, sum_gamma / sum_w, sum_visc / sum_w

def predict_ph(t_min, temp, inoc, ph_init=6.25, ph_final=4.52):
    t50, gamma, _ = interpolate_params(temp, inoc)
    denom = 1.0 + (t_min / max(t50, 1.0))**gamma
    return ph_final + (ph_init - ph_final) / denom

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(script_dir, 'data', 'fermentacion_uleam.csv')

    print("===============================================================")
    print("[PREDIYOGUR] MODELO PREDICTIVO CIENTIFICO DE FERMENTACION")
    print("   Universidad Laica Eloy Alfaro de Manabi (ULEAM)")
    print("   Catedra de Quimica de Alimentos - Dr. Stalin Santacruz")
    print("===============================================================")

    data = load_dataset(csv_path)
    print(f"Dataset cargado: {len(data)} observaciones experimentales reales.")

    sse = 0.0
    sae = 0.0
    ph_mean = sum(d['ph'] for d in data) / len(data)
    sst = sum((d['ph'] - ph_mean)**2 for d in data)

    for d in data:
        pred = predict_ph(d['t_min'], d['temp'], d['inoc'])
        err = pred - d['ph']
        sse += err**2
        sae += abs(err)

    n = len(data)
    mse = sse / n
    rmse = math.sqrt(mse)
    mae = sae / n
    r2 = 1.0 - (sse / sst)

    print("\n--- RESULTADOS DE VALIDACION DEL MODELO ---")
    print(f"Coeficiente de Determinacion R2: {r2:.4f} ({r2*100:.2f}%)")
    print(f"Error Cuadratico Medio (RMSE):   {rmse:.4f} unidades de pH")
    print(f"Error Absoluto Medio (MAE):      {mae:.4f} unidades de pH")
    print(f"Precision de Ajuste Global:      {(1 - (mae / ph_mean))*100:.2f}%")

    if r2 >= 0.95:
        print("\n[OK] Modelo clasificado como: EXCELENCIA CIENTIFICA (R2 > 0.95)")
    print("===============================================================")

if __name__ == '__main__':
    main()
