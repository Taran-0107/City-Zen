# utils/carbon_calculator.py - Carbon footprint calculation utilities

def calculate_carbon_savings(bill_type, usage_reduction):
    """Calculate carbon footprint savings based on resource usage reduction"""
    
    # Carbon emission factors (kg CO2 per unit)
    emission_factors = {
        'electricity': {
            'kWh': 0.5,      # kg CO2 per kWh (varies by region)
            'MWh': 500       # kg CO2 per MWh
        },
        'water': {
            'liters': 0.0003,        # kg CO2 per liter
            'cubic_meters': 0.3,     # kg CO2 per cubic meter
            'gallons': 0.001         # kg CO2 per gallon
        },
        'gas': {
            'cubic_meters': 2.0,     # kg CO2 per cubic meter
            'therms': 5.3,           # kg CO2 per therm
            'kWh': 0.2               # kg CO2 per kWh (gas equivalent)
        }
    }
    
    # Default factor if specific type/unit not found
    default_factors = {
        'electricity': 0.5,
        'water': 0.0003,
        'gas': 2.0
    }
    
    if bill_type in emission_factors:
        # For now, use the first factor available for the bill type
        factor = list(emission_factors[bill_type].values())[0]
    else:
        factor = default_factors.get(bill_type, 0.5)  # Default to electricity factor
    
    carbon_saved = usage_reduction * factor
    return round(carbon_saved, 2)

def get_carbon_equivalent_impacts(carbon_kg):
    """Convert carbon savings to equivalent environmental impacts"""
    
    equivalents = {
        'trees_planted': carbon_kg / 22,  # 1 tree absorbs ~22kg CO2/year
        'car_miles_avoided': carbon_kg / 0.404,  # ~0.404kg CO2 per mile
        'plastic_bottles_recycled': carbon_kg / 0.082,  # ~0.082kg CO2 per bottle
        'light_bulbs_hours': carbon_kg / 0.0005,  # ~0.0005kg CO2 per hour (LED)
    }
    
    return {
        key: round(value, 1) for key, value in equivalents.items()
    }