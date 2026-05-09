#!/usr/bin/env bash

python3 copy_analysis_ready_data.py
python3 generate_hazard_outputs.py
python3 generate_site_vulnerability.py
python3 generate_granite_influence.py
python3 generate_recorded_site_priority.py
python3 generate_precaution_zone.py
