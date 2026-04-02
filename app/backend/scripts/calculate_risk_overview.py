from pathlib import Path


def main() -> None:
    backend_dir = Path(__file__).resolve().parents[1]
    output_path = backend_dir / "data" / "risk_overview.geojson"

    print("Risk overview generation placeholder")
    print(f"Target output: {output_path}")
    print("This script will later combine the prepared GIS layers and cache a result file.")


if __name__ == "__main__":
    main()
