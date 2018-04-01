import cfscrape
import sys

scraper = cfscrape.create_scraper()
r = scraper.get(sys.argv[1])
print r.content