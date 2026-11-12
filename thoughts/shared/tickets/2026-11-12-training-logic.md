# Open calendar says "Recover"; bring real training logic into the model

Two things, reported from production with a screenshot:

1. **Bug.** With zero calendar data the card says "Survival Mode · Recover"
   (Readiness 41, Load 0, Balance +0). An empty day should not say recover.
2. **Training logic.** The model is basically saying "hard work day, train
   easy". That is not data intelligence. Pull in actual training logic. Look
   up Jason Koop and David Roche, or the coaches of recent UTMB and Western
   States 100 winners, for the logic.
