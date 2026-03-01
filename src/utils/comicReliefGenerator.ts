import { WorkHealthMetrics } from '../hooks/useWorkHealth';

interface MovieQuote {
  text: string;
  source: string; // Movie, TV show, book, standup special, or person
  character?: string; // Character, comedian, or person who said it
  category: 'performance' | 'meetings' | 'focus' | 'resilience' | 'balance';
  tone: 'sarcastic' | 'dry' | 'motivational' | 'defeated' | 'confident';
}

interface MetricBasedQuote {
  condition: (metrics: WorkHealthMetrics) => boolean;
  quotes: MovieQuote[];
}

export class ComicReliefGenerator {
  private metricBasedQuotes: MetricBasedQuote[] = [
    // EXCELLENT Performance (90+ adaptive performance index)
    {
      condition: (m) => m.adaptivePerformanceIndex >= 90,
      quotes: [
        { text: "I am inevitable.", source: "Avengers: Endgame", character: "Thanos", category: 'performance', tone: 'confident' },
        { text: "I'm the king of the world!", source: "Titanic", character: "Jack Dawson", category: 'performance', tone: 'confident' },
        { text: "Say hello to my little friend!", source: "Scarface", character: "Tony Montana", category: 'performance', tone: 'confident' },
        { text: "I'll be back.", source: "The Terminator", character: "Terminator", category: 'performance', tone: 'confident' },
        { text: "Nobody makes me bleed my own blood.", source: "Dodgeball", character: "White Goodman", category: 'performance', tone: 'confident' },
        { text: "I have the high ground!", source: "Star Wars: Revenge of the Sith", character: "Obi-Wan", category: 'performance', tone: 'confident' },
        { text: "Are you not entertained?", source: "Gladiator", character: "Maximus", category: 'performance', tone: 'confident' },
        { text: "You bow to no one.", source: "The Lord of the Rings: Return of the King", character: "Aragorn", category: 'performance', tone: 'confident' },
        { text: "I'm not trapped in here with you. You're trapped in here with me!", source: "Watchmen", character: "Rorschach", category: 'performance', tone: 'confident' },
        { text: "Yippee-ki-yay, motherfucker!", source: "Die Hard", character: "John McClane", category: 'performance', tone: 'confident' },
        { text: "I came here to chew bubblegum and kick ass, and I'm all out of bubblegum.", source: "They Live", character: "Nada", category: 'performance', tone: 'confident' },
        { text: "Hasta la vista, baby.", source: "Terminator 2", character: "Terminator", category: 'performance', tone: 'confident' },
      ]
    },

    // HIGH Performance (75-89 adaptive performance index)
    {
      condition: (m) => m.adaptivePerformanceIndex >= 75 && m.adaptivePerformanceIndex < 90,
      quotes: [
        { text: "Life moves pretty fast. If you don't stop and look around once in a while, you could miss it.", source: "Ferris Bueller's Day Off", character: "Ferris", category: 'performance', tone: 'dry' },
        { text: "I'm not bad. I'm just drawn that way.", source: "Who Framed Roger Rabbit", character: "Jessica Rabbit", category: 'performance', tone: 'sarcastic' },
        { text: "Keep your friends close, but your enemies closer.", source: "The Godfather Part II", character: "Michael Corleone", category: 'performance', tone: 'dry' },
        { text: "May the Force be with you.", source: "Star Wars", character: "Obi-Wan", category: 'performance', tone: 'motivational' },
        { text: "Frankly, my dear, I don't give a damn.", source: "Gone with the Wind", character: "Rhett Butler", category: 'performance', tone: 'confident' },
        { text: "I feel the need... the need for speed!", source: "Top Gun", character: "Maverick", category: 'performance', tone: 'confident' },
        { text: "You can't handle the truth!", source: "A Few Good Men", character: "Col. Jessup", category: 'performance', tone: 'confident' },
        { text: "Show me the money!", source: "Jerry Maguire", character: "Rod Tidwell", category: 'performance', tone: 'confident' },
        { text: "I'm gonna make him an offer he can't refuse.", source: "The Godfather", character: "Don Corleone", category: 'performance', tone: 'confident' },
        { text: "Go ahead, make my day.", source: "Sudden Impact", character: "Harry Callahan", category: 'performance', tone: 'confident' },
        { text: "Elementary, my dear Watson.", source: "Sherlock Holmes", character: "Sherlock", category: 'performance', tone: 'confident' },
        { text: "Bond. James Bond.", source: "Dr. No", character: "James Bond", category: 'performance', tone: 'confident' },
      ]
    },

    // MODERATE Performance (50-74 adaptive performance index)
    {
      condition: (m) => m.adaptivePerformanceIndex >= 50 && m.adaptivePerformanceIndex < 75,
      quotes: [
        { text: "Not great, not terrible.", source: "Chernobyl", character: "Anatoly Dyatlov", category: 'performance', tone: 'dry' },
        { text: "I'm not a smart man, but I know what love is.", source: "Forrest Gump", character: "Forrest", category: 'performance', tone: 'dry' },
        { text: "Perfectly balanced, as all things should be.", source: "Avengers: Infinity War", character: "Thanos", category: 'performance', tone: 'sarcastic' },
        { text: "Yeah, well, that's just like, your opinion, man.", source: "The Big Lebowski", character: "The Dude", category: 'performance', tone: 'dry' },
        { text: "That'll do, pig. That'll do.", source: "Babe", character: "Farmer Hoggett", category: 'performance', tone: 'dry' },
        { text: "Here's looking at you, kid.", source: "Casablanca", character: "Rick Blaine", category: 'performance', tone: 'dry' },
        { text: "I'm not superstitious, but I am a little stitious.", source: "The Office", character: "Michael Scott", category: 'performance', tone: 'dry' },
        { text: "Same same, but different.", source: "The Interview", character: "Dave Skylark", category: 'performance', tone: 'dry' },
        { text: "Meh.", source: "The Simpsons", character: "Bart Simpson", category: 'performance', tone: 'dry' },
        { text: "I find your lack of faith disturbing.", source: "Star Wars", character: "Darth Vader", category: 'performance', tone: 'sarcastic' },
        { text: "You're gonna need a bigger boat.", source: "Jaws", character: "Chief Brody", category: 'performance', tone: 'dry' },
        { text: "It's not the years, honey. It's the mileage.", source: "Raiders of the Lost Ark", character: "Indiana Jones", category: 'performance', tone: 'dry' },
      ]
    },

    // POOR Performance (25-49 adaptive performance index)
    {
      condition: (m) => m.adaptivePerformanceIndex >= 25 && m.adaptivePerformanceIndex < 50,
      quotes: [
        { text: "I feel like I'm taking crazy pills!", source: "Zoolander", character: "Mugatu", category: 'performance', tone: 'defeated' },
        { text: "This is fine.", source: "Gunshow Comic", character: "KC Green's Dog", category: 'performance', tone: 'sarcastic' },
        { text: "I don't like sand. It's coarse and rough and gets everywhere.", source: "Star Wars: Attack of the Clones", character: "Anakin", category: 'performance', tone: 'defeated' },
        { text: "Why so serious?", source: "The Dark Knight", character: "The Joker", category: 'performance', tone: 'sarcastic' },
        { text: "I'm getting too old for this shit.", source: "Lethal Weapon", character: "Roger Murtaugh", category: 'performance', tone: 'defeated' },
        { text: "Houston, we have a problem.", source: "Apollo 13", character: "Jim Lovell", category: 'performance', tone: 'defeated' },
        { text: "Well, that escalated quickly.", source: "Anchorman", character: "Ron Burgundy", category: 'performance', tone: 'sarcastic' },
        { text: "I immediately regret this decision.", source: "Anchorman", character: "Ron Burgundy", category: 'performance', tone: 'defeated' },
        { text: "I've made a huge mistake.", source: "Arrested Development", character: "Gob Bluth", category: 'performance', tone: 'defeated' },
        { text: "That's not gone well.", source: "Top Gear", character: "Jeremy Clarkson", category: 'performance', tone: 'defeated' },
        { text: "It's just a flesh wound.", source: "Monty Python and the Holy Grail", character: "The Black Knight", category: 'performance', tone: 'sarcastic' },
        { text: "We're not gonna make it, are we?", source: "Terminator 2", character: "John Connor", category: 'performance', tone: 'defeated' },
      ]
    },

    // VERY POOR Performance (below 25 adaptive performance index)
    {
      condition: (m) => m.adaptivePerformanceIndex < 25,
      quotes: [
        { text: "Game over, man! Game over!", source: "Aliens", character: "Hudson", category: 'performance', tone: 'defeated' },
        { text: "I'm not dead yet!", source: "Monty Python and the Holy Grail", character: "Not Dead Yet Man", category: 'performance', tone: 'defeated' },
        { text: "Help me, Obi-Wan Kenobi. You're my only hope.", source: "Star Wars", character: "Princess Leia", category: 'performance', tone: 'defeated' },
        { text: "I see dead people.", source: "The Sixth Sense", character: "Cole Sear", category: 'performance', tone: 'defeated' },
        { text: "We're gonna need a bigger boat.", source: "Jaws", character: "Brody", category: 'performance', tone: 'defeated' },
        { text: "Coffee is for closers.", source: "Glengarry Glen Ross", character: "Blake", category: 'performance', tone: 'defeated' },
        { text: "I've got a bad feeling about this.", source: "Star Wars", character: "Han Solo", category: 'performance', tone: 'defeated' },
        { text: "Send more paramedics.", source: "Return of the Living Dead", character: "Zombie", category: 'performance', tone: 'defeated' },
        { text: "I don't think we're in Kansas anymore.", source: "The Wizard of Oz", character: "Dorothy", category: 'performance', tone: 'defeated' },
        { text: "You want me to strap her to the hood? She'll be fine, it's not that far.", source: "National Lampoon's Vacation", character: "Clark Griswold", category: 'performance', tone: 'sarcastic' },
        { text: "Here's Johnny!", source: "The Shining", character: "Jack Torrance", category: 'performance', tone: 'defeated' },
      ]
    },

    // BACK-TO-BACK MEETINGS (high back-to-back count)
    {
      condition: (m) => (m.schedule?.backToBackCount != null && m.schedule.backToBackCount > 3),
      quotes: [
        { text: "I volunteer as tribute.", source: "The Hunger Games", character: "Katniss Everdeen", category: 'meetings', tone: 'defeated' },
        { text: "You shall not pass!", source: "The Lord of the Rings", character: "Gandalf", category: 'meetings', tone: 'defeated' },
        { text: "Every time I think I'm out, they pull me back in.", source: "The Godfather Part III", character: "Michael Corleone", category: 'meetings', tone: 'defeated' },
        { text: "It's the same thing every day. Clean up your mess, and deal with the next one.", source: "No Country for Old Men", character: "Ed Tom Bell", category: 'meetings', tone: 'defeated' },
        { text: "Gentlemen, you can't fight in here! This is the War Room!", source: "Dr. Strangelove", character: "President Merkin Muffley", category: 'meetings', tone: 'sarcastic' },
        { text: "I'm in a glass case of emotion!", source: "Anchorman", character: "Ron Burgundy", category: 'meetings', tone: 'defeated' },
        { text: "Fasten your seatbelts, it's going to be a bumpy night.", source: "All About Eve", character: "Margo Channing", category: 'meetings', tone: 'sarcastic' },
      ]
    },

    // FRAGMENTED SCHEDULE (high fragmentation score)
    {
      condition: (m) => (m.schedule?.fragmentationScore != null && m.schedule.fragmentationScore > 0.7),
      quotes: [
        { text: "Chaos isn't a pit. Chaos is a ladder.", source: "Game of Thrones", character: "Littlefinger", category: 'balance', tone: 'sarcastic' },
        { text: "I am serious. And don't call me Shirley.", source: "Airplane!", character: "Dr. Rumack", category: 'balance', tone: 'dry' },
        { text: "It's a madhouse! A madhouse!", source: "Planet of the Apes", character: "Taylor", category: 'balance', tone: 'defeated' },
        { text: "I'm having an old friend for dinner.", source: "The Silence of the Lambs", character: "Hannibal Lecter", category: 'balance', tone: 'sarcastic' },
        { text: "We're on a mission from God.", source: "The Blues Brothers", character: "Elwood Blues", category: 'balance', tone: 'dry' },
        { text: "I'm the Dude, so that's what you call me.", source: "The Big Lebowski", character: "The Dude", category: 'balance', tone: 'dry' },
        { text: "Chaos reigns.", source: "Antichrist", character: "The Fox", category: 'balance', tone: 'defeated' },
      ]
    },

    // VERY HIGH Performance AND Low Strain (showing off)
    {
      condition: (m) => m.adaptivePerformanceIndex >= 85 && m.cognitiveResilience <= 25,
      quotes: [
        { text: "Bring it on!", source: "Bring It On", character: "Torrance", category: 'performance', tone: 'confident' },
        { text: "Challenge accepted.", source: "How I Met Your Mother", character: "Barney Stinson", category: 'performance', tone: 'confident' },
        { text: "I am Groot.", source: "Guardians of the Galaxy", character: "Groot", category: 'performance', tone: 'confident' },
        { text: "I'm Batman.", source: "Batman Begins", character: "Bruce Wayne", category: 'performance', tone: 'confident' },
        { text: "Witness me!", source: "Mad Max: Fury Road", character: "Nux", category: 'performance', tone: 'confident' },
        { text: "I drink your milkshake!", source: "There Will Be Blood", character: "Daniel Plainview", category: 'performance', tone: 'confident' },
      ]
    },

    // LOW Performance AND High Strain (double trouble)
    {
      condition: (m) => m.adaptivePerformanceIndex < 40 && m.cognitiveResilience > 60,
      quotes: [
        { text: "Rosebud.", source: "Citizen Kane", character: "Charles Foster Kane", category: 'performance', tone: 'defeated' },
        { text: "I coulda been a contender.", source: "On the Waterfront", character: "Terry Malloy", category: 'performance', tone: 'defeated' },
        { text: "What we've got here is failure to communicate.", source: "Cool Hand Luke", character: "Captain", category: 'performance', tone: 'defeated' },
        { text: "Mama always said life was like a box of chocolates.", source: "Forrest Gump", character: "Forrest Gump", category: 'performance', tone: 'defeated' },
        { text: "I'm mad as hell, and I'm not going to take this anymore!", source: "Network", character: "Howard Beale", category: 'performance', tone: 'defeated' },
        { text: "Forget it, Jake. It's Chinatown.", source: "Chinatown", character: "Lawrence Walsh", category: 'performance', tone: 'defeated' },
        { text: "The horror... the horror.", source: "Apocalypse Now", character: "Colonel Kurtz", category: 'performance', tone: 'defeated' },
      ]
    },

    // MEETING OVERLOAD (high meeting ratio OR many meetings)
    {
      condition: (m) => (m.schedule?.meetingRatio != null && m.schedule.meetingRatio > 0.5) || (m.schedule?.meetingCount != null && m.schedule.meetingCount > 5),
      quotes: [
        { text: "I have a very particular set of skills.", source: "Taken", character: "Bryan Mills", category: 'meetings', tone: 'dry' },
        { text: "Nobody puts Baby in a corner.", source: "Dirty Dancing", character: "Johnny", category: 'meetings', tone: 'sarcastic' },
        { text: "I'm surrounded by idiots.", source: "The Lion King", character: "Scar", category: 'meetings', tone: 'sarcastic' },
        { text: "That's what she said.", source: "The Office", character: "Michael Scott", category: 'meetings', tone: 'sarcastic' },
        { text: "I'm not locked in here with you. You're locked in here with me!", source: "Watchmen", character: "Rorschach", category: 'meetings', tone: 'defeated' },
        { text: "The horror... the horror.", source: "Apocalypse Now", character: "Kurtz", category: 'meetings', tone: 'defeated' },
        { text: "I find your lack of faith disturbing.", source: "Star Wars", character: "Darth Vader", category: 'meetings', tone: 'sarcastic' },
        { text: "I'm gonna need you to come in on Saturday.", source: "Office Space", character: "Bill Lumbergh", category: 'meetings', tone: 'defeated' },
        { text: "PC Load Letter? What the fuck does that mean?", source: "Office Space", character: "Michael Bolton", category: 'meetings', tone: 'defeated' },
        { text: "I have people skills!", source: "Office Space", character: "Tom Smykowski", category: 'meetings', tone: 'defeated' },
        { text: "That would be great.", source: "Office Space", character: "Bill Lumbergh", category: 'meetings', tone: 'sarcastic' },
        { text: "Did you get the memo?", source: "Office Space", character: "Bill Lumbergh", category: 'meetings', tone: 'sarcastic' },
        { text: "I'm not even supposed to be here today.", source: "Clerks", character: "Dante Hicks", category: 'meetings', tone: 'defeated' },
        { text: "We're gonna need a montage.", source: "Team America: World Police", character: "Narrator", category: 'meetings', tone: 'sarcastic' },
      ]
    },

    // LOW FOCUS TIME (less than 2 hours)
    {
      condition: (m) => m.focusTime < 120,
      quotes: [
        { text: "Life is like a box of chocolates. You never know what you're gonna get.", source: "Forrest Gump", character: "Forrest", category: 'focus', tone: 'dry' },
        { text: "Badges? We ain't got no badges! We don't need no badges!", source: "The Treasure of the Sierra Madre", character: "Gold Hat", category: 'focus', tone: 'sarcastic' },
        { text: "My brain hurts!", source: "Monty Python's Flying Circus", character: "Mr. Gumby", category: 'focus', tone: 'defeated' },
        { text: "I know kung fu.", source: "The Matrix", character: "Neo", category: 'focus', tone: 'sarcastic' },
        { text: "There is no spoon.", source: "The Matrix", character: "Spoon Boy", category: 'focus', tone: 'dry' },
        { text: "What's in the box?", source: "Se7en", character: "David Mills", category: 'focus', tone: 'defeated' },
        { text: "Squirrel!", source: "Up", character: "Dug", category: 'focus', tone: 'sarcastic' },
        { text: "Pay no attention to the man behind the curtain.", source: "The Wizard of Oz", character: "The Wizard", category: 'focus', tone: 'sarcastic' },
        { text: "You talkin' to me?", source: "Taxi Driver", character: "Travis Bickle", category: 'focus', tone: 'defeated' },
        { text: "I'm walkin' here!", source: "Midnight Cowboy", character: "Ratso Rizzo", category: 'focus', tone: 'defeated' },
        { text: "Wait a minute, wait a minute. You ain't heard nothin' yet!", source: "The Jazz Singer", character: "Jakie Rabinowitz", category: 'focus', tone: 'sarcastic' },
      ]
    },

    // LOW STRAIN (strain ≤ 20 = high resilience)
    {
      condition: (m) => m.cognitiveResilience <= 20,
      quotes: [
        { text: "I can do this all day.", source: "Captain America: The First Avenger", character: "Steve Rogers", category: 'resilience', tone: 'confident' },
        { text: "What we do in life echoes in eternity.", source: "Gladiator", character: "Maximus", category: 'resilience', tone: 'motivational' },
        { text: "You either die a hero, or you live long enough to see yourself become the villain.", source: "The Dark Knight", character: "Harvey Dent", category: 'resilience', tone: 'dry' },
        { text: "Do or do not, there is no try.", source: "The Empire Strikes Back", character: "Yoda", category: 'resilience', tone: 'motivational' },
        { text: "I am Iron Man.", source: "Iron Man", character: "Tony Stark", category: 'resilience', tone: 'confident' },
        { text: "With great power comes great responsibility.", source: "Spider-Man", character: "Uncle Ben", category: 'resilience', tone: 'motivational' },
        { text: "I'm not wearing hockey pads.", source: "The Dark Knight", character: "Batman", category: 'resilience', tone: 'confident' },
        { text: "Bring me Thanos!", source: "Avengers: Infinity War", character: "Thor", category: 'resilience', tone: 'confident' },
      ]
    },

    // HIGH STRAIN (strain > 60 = low resilience)
    {
      condition: (m) => m.cognitiveResilience > 60,
      quotes: [
        { text: "I'm melting! Melting!", source: "The Wizard of Oz", character: "Wicked Witch", category: 'resilience', tone: 'defeated' },
        { text: "I'm mad as hell, and I'm not going to take this anymore!", source: "Network", character: "Howard Beale", category: 'resilience', tone: 'defeated' },
        { text: "The dude abides.", source: "The Big Lebowski", character: "The Dude", category: 'resilience', tone: 'defeated' },
        { text: "I'm tired, boss.", source: "The Green Mile", character: "John Coffey", category: 'resilience', tone: 'defeated' },
        { text: "After all, tomorrow is another day.", source: "Gone with the Wind", character: "Scarlett O'Hara", category: 'resilience', tone: 'defeated' },
        { text: "I wish I knew how to quit you.", source: "Brokeback Mountain", character: "Jack Twist", category: 'resilience', tone: 'defeated' },
        { text: "Leave the gun. Take the cannoli.", source: "The Godfather", character: "Clemenza", category: 'resilience', tone: 'dry' },
        { text: "Snap out of it!", source: "Moonstruck", character: "Loretta Castorini", category: 'resilience', tone: 'defeated' },
      ]
    },

    // POOR WORK RHYTHM RECOVERY (below 30)
    {
      condition: (m) => m.workRhythmRecovery < 30,
      quotes: [
        { text: "Everything is terrible.", source: "The Lego Movie", character: "Batman", category: 'balance', tone: 'defeated' },
        { text: "I want to go home.", source: "E.T. the Extra-Terrestrial", character: "E.T.", category: 'balance', tone: 'defeated' },
        { text: "Not today, Satan.", source: "RuPaul's Drag Race", character: "Bianca Del Rio", category: 'balance', tone: 'sarcastic' },
        { text: "What a dump.", source: "Beyond the Forest", character: "Rosa Moline", category: 'balance', tone: 'defeated' },
        { text: "I have always depended on the kindness of strangers.", source: "A Streetcar Named Desire", character: "Blanche DuBois", category: 'balance', tone: 'defeated' },
        { text: "Toto, I've a feeling we're not in Kansas anymore.", source: "The Wizard of Oz", character: "Dorothy", category: 'balance', tone: 'defeated' },
        { text: "Forget it, Jake. It's Chinatown.", source: "Chinatown", character: "Lawrence Walsh", category: 'balance', tone: 'defeated' },
      ]
    },

    // GOOD WORK RHYTHM RECOVERY (70+)
    {
      condition: (m) => m.workRhythmRecovery >= 70,
      quotes: [
        { text: "Everything is awesome!", source: "The Lego Movie", character: "Emmet", category: 'balance', tone: 'motivational' },
        { text: "Hakuna Matata!", source: "The Lion King", character: "Timon & Pumbaa", category: 'balance', tone: 'motivational' },
        { text: "Life finds a way.", source: "Jurassic Park", character: "Ian Malcolm", category: 'balance', tone: 'confident' },
        { text: "This is the way.", source: "The Mandalorian", character: "Din Djarin", category: 'balance', tone: 'confident' },
        { text: "Excellent!", source: "Bill & Ted's Excellent Adventure", character: "Bill & Ted", category: 'balance', tone: 'confident' },
        { text: "Groovy.", source: "Army of Darkness", character: "Ash Williams", category: 'balance', tone: 'confident' },
        { text: "Oh, what a day! What a lovely day!", source: "Mad Max: Fury Road", character: "Nux", category: 'balance', tone: 'confident' },
        { text: "I'm just a girl, standing in front of a boy, asking him to love her.", source: "Notting Hill", character: "Anna Scott", category: 'balance', tone: 'dry' },
      ]
    },

    // GREAT FOCUS TIME (4+ hours) — only if the day is actually decent (not Meeting Hell with pre-9am "focus")
    {
      condition: (m) => m.focusTime >= 240 && m.adaptivePerformanceIndex >= 60,
      quotes: [
        { text: "The Force is strong with this one.", source: "Star Wars", character: "Darth Vader", category: 'focus', tone: 'confident' },
        { text: "Wax on, wax off.", source: "The Karate Kid", character: "Mr. Miyagi", category: 'focus', tone: 'motivational' },
        { text: "One does not simply walk into Mordor.", source: "The Lord of the Rings", character: "Boromir", category: 'focus', tone: 'dry' },
        { text: "I am one with the Force, the Force is with me.", source: "Rogue One", character: "Chirrut Imwe", category: 'focus', tone: 'motivational' },
        { text: "Now I am become Death, the destroyer of worlds.", source: "Oppenheimer", character: "J. Robert Oppenheimer", category: 'focus', tone: 'confident' },
        { text: "I see you.", source: "Avatar", character: "Neytiri", category: 'focus', tone: 'confident' },
        { text: "The name's Bond. James Bond.", source: "Casino Royale", character: "James Bond", category: 'focus', tone: 'confident' },
        { text: "A martini. Shaken, not stirred.", source: "Goldfinger", character: "James Bond", category: 'focus', tone: 'confident' },
        { text: "I have a cunning plan.", source: "Blackadder", character: "Baldrick", category: 'focus', tone: 'sarcastic' },
        { text: "Clear eyes, full hearts, can't lose.", source: "Friday Night Lights", character: "Coach Taylor", category: 'focus', tone: 'motivational' },
      ]
    },

    // MODERATE Performance with GREAT Focus Time
    {
      condition: (m) => m.adaptivePerformanceIndex >= 60 && m.adaptivePerformanceIndex < 80 && m.focusTime >= 240,
      quotes: [
        { text: "Slow and steady wins the race.", source: "The Tortoise and the Hare", character: "Aesop", category: 'focus', tone: 'motivational' },
        { text: "Just keep swimming.", source: "Finding Nemo", character: "Dory", category: 'focus', tone: 'motivational' },
        { text: "It does not do to dwell on dreams and forget to live.", source: "Harry Potter and the Philosopher's Stone", character: "Dumbledore", category: 'focus', tone: 'motivational' },
        { text: "After all this time? Always.", source: "Harry Potter and the Deathly Hallows", character: "Severus Snape", category: 'focus', tone: 'motivational' },
        { text: "Roads? Where we're going, we don't need roads.", source: "Back to the Future", character: "Doc Brown", category: 'focus', tone: 'confident' },
        { text: "To infinity and beyond!", source: "Toy Story", character: "Buzz Lightyear", category: 'focus', tone: 'confident' },
      ]
    },

    // HIGH Cognitive Availability
    {
      condition: (m) => m.cognitiveAvailability >= 80,
      quotes: [
        { text: "I'm king of the world!", source: "Titanic", character: "Jack Dawson", category: 'performance', tone: 'confident' },
        { text: "Today, we are canceling the apocalypse!", source: "Pacific Rim", character: "Stacker Pentecost", category: 'performance', tone: 'confident' },
        { text: "I feel the need... the need for speed!", source: "Top Gun", character: "Maverick", category: 'performance', tone: 'confident' },
        { text: "Why do we fall? So we can learn to pick ourselves up.", source: "Batman Begins", character: "Alfred", category: 'performance', tone: 'motivational' },
        { text: "It's showtime!", source: "Beetlejuice", character: "Beetlejuice", category: 'performance', tone: 'confident' },
      ]
    },

    // LOW Cognitive Availability
    {
      condition: (m) => m.cognitiveAvailability < 30,
      quotes: [
        { text: "Here's looking at you, kid.", source: "Casablanca", character: "Rick Blaine", category: 'performance', tone: 'defeated' },
        { text: "You're killin' me, Smalls.", source: "The Sandlot", character: "Ham Porter", category: 'performance', tone: 'sarcastic' },
        { text: "I see dead people.", source: "The Sixth Sense", character: "Cole Sear", category: 'performance', tone: 'defeated' },
        { text: "Why is the rum always gone?", source: "Pirates of the Caribbean", character: "Jack Sparrow", category: 'performance', tone: 'defeated' },
        { text: "I'm having a friend for dinner.", source: "The Silence of the Lambs", character: "Hannibal Lecter", category: 'performance', tone: 'sarcastic' },
      ]
    }
  ];

  // Standup/comedy special quotes — for variety beyond film/TV
  private standupQuotes: MetricBasedQuote[] = [
    // Great days
    {
      condition: (m) => m.adaptivePerformanceIndex >= 75,
      quotes: [
        { text: "In terms of instant gratification, a microwave is pretty slow.", source: "Standup", character: "Mitch Hedberg", category: 'performance', tone: 'dry' },
        { text: "I used to do drugs. I still do, but I used to, too.", source: "Standup", character: "Mitch Hedberg", category: 'performance', tone: 'dry' },
        { text: "My fake plants died because I did not pretend to water them.", source: "Standup", character: "Mitch Hedberg", category: 'performance', tone: 'dry' },
        { text: "I haven't slept for ten days, because that would be too long.", source: "Standup", character: "Mitch Hedberg", category: 'performance', tone: 'dry' },
        { text: "I'm not weird, I'm limited edition.", source: "Standup", character: "Steven Wright", category: 'performance', tone: 'confident' },
        { text: "I intend to live forever. So far, so good.", source: "Standup", character: "Steven Wright", category: 'performance', tone: 'confident' },
        { text: "Everywhere is walking distance if you have the time.", source: "Standup", character: "Steven Wright", category: 'performance', tone: 'dry' },
        { text: "I'm at the age where food has replaced sex in my life. In fact, I've just had a mirror put over my kitchen table.", source: "Standup", character: "Rodney Dangerfield", category: 'performance', tone: 'dry' },
        { text: "I told my psychiatrist that everyone hates me. He said I was being ridiculous — everyone hasn't met me yet.", source: "Standup", character: "Rodney Dangerfield", category: 'performance', tone: 'sarcastic' },
        { text: "Before you judge a man, walk a mile in his shoes. After that who cares? He's a mile away and you've got his shoes.", source: "Standup", character: "Billy Connolly", category: 'performance', tone: 'confident' },
      ]
    },
    // Rough days
    {
      condition: (m) => m.adaptivePerformanceIndex < 50,
      quotes: [
        { text: "I want to be the reason you look down at your phone and smile. Then walk into a pole.", source: "Standup", character: "Ali Wong", category: 'performance', tone: 'sarcastic' },
        { text: "The first time I see a jogger smiling, I'll consider it.", source: "Standup", character: "Joan Rivers", category: 'performance', tone: 'sarcastic' },
        { text: "I'm not afraid of death; I just don't want to be there when it happens.", source: "Without Feathers", character: "Woody Allen", category: 'performance', tone: 'defeated' },
        { text: "Why do they call it rush hour when nothing moves?", source: "Standup", character: "Robin Williams", category: 'performance', tone: 'sarcastic' },
        { text: "I have a lot of growing up to do. I realized that the other day inside my fort.", source: "Standup", character: "Zach Galifianakis", category: 'performance', tone: 'defeated' },
        { text: "My therapist says I have a preoccupation with vengeance. We'll see about that.", source: "Standup", character: "Stewart Francis", category: 'performance', tone: 'sarcastic' },
        { text: "I'm writing a book. I've got the page numbers done.", source: "Standup", character: "Steven Wright", category: 'performance', tone: 'defeated' },
        { text: "I like Kit-Kats, unless I'm with four or more people.", source: "Standup", character: "Mitch Hedberg", category: 'performance', tone: 'dry' },
      ]
    },
    // Meeting-heavy days
    {
      condition: (m) => (m.schedule?.meetingCount != null && m.schedule.meetingCount > 4),
      quotes: [
        { text: "A committee is a group of people who individually can do nothing, but as a group decide that nothing can be done.", source: "Quote", character: "Fred Allen", category: 'meetings', tone: 'sarcastic' },
        { text: "People say nothing is impossible, but I do nothing every day.", source: "Standup", character: "Brian Regan", category: 'meetings', tone: 'dry' },
        { text: "I'm not arguing, I'm just explaining why I'm right.", source: "Standup", character: "John Mulaney", category: 'meetings', tone: 'sarcastic' },
        { text: "In my house I'm the boss, my wife is just the decision maker.", source: "Standup", character: "Woody Allen", category: 'meetings', tone: 'defeated' },
        { text: "I love deadlines. I love the whooshing noise they make as they go by.", source: "Quote", character: "Douglas Adams", category: 'meetings', tone: 'dry' },
      ]
    },
  ];

  // Extra movie/TV/comedian quotes
  private standupExtras: MetricBasedQuote[] = [
    {
      condition: (m) => m.adaptivePerformanceIndex >= 70,
      quotes: [
        { text: "I'm not superstitious, but I am a little stitious.", source: "The Office", character: "Michael Scott", category: 'performance', tone: 'confident' },
        { text: "Cool. Cool cool cool cool cool.", source: "Brooklyn Nine-Nine", character: "Jake Peralta", category: 'performance', tone: 'confident' },
        { text: "I am Beyoncé always.", source: "The Office", character: "Michael Scott", category: 'performance', tone: 'confident' },
        { text: "In this world, you get what you pay for.", source: "Mad Men", character: "Don Draper", category: 'performance', tone: 'confident' },
        { text: "I once saw a forklift lift a crate of forks. And it was way too literal for me.", source: "Standup", character: "Mitch Hedberg", category: 'performance', tone: 'dry' },
        { text: "You know what's weird? Donald Duck never wore pants. But whenever he's getting out of the shower, he always puts a towel around his waist.", source: "Standup", character: "John Mulaney", category: 'balance', tone: 'dry' },
        { text: "I'm on a seafood diet. I see food and I eat it.", source: "Standup", character: "Rodney Dangerfield", category: 'balance', tone: 'dry' },
        { text: "I am serious. And don't call me Shirley.", source: "Airplane!", character: "Dr. Rumack", category: 'performance', tone: 'dry' },
      ]
    },
    {
      condition: (m) => m.adaptivePerformanceIndex < 50,
      quotes: [
        { text: "I knew exactly what to do. But in a much more real sense, I had no idea what to do.", source: "The Office", character: "Michael Scott", category: 'performance', tone: 'defeated' },
        { text: "Everything is fine.", source: "The Good Place", character: "Eleanor Shellstrop", category: 'resilience', tone: 'defeated' },
        { text: "I'm not a doctor, but I'm losing patients.", source: "Standup", character: "Anthony Jeselnik", category: 'performance', tone: 'sarcastic' },
        { text: "My wallet is like an onion. Opening it makes me cry.", source: "Standup", character: "Jimmy Carr", category: 'performance', tone: 'defeated' },
        { text: "I have the body of an 18-year-old. I keep it in the fridge.", source: "Standup", character: "Spike Milligan", category: 'resilience', tone: 'sarcastic' },
        { text: "You miss 100% of the shots you don't take. — Wayne Gretzky", source: "The Office", character: "Michael Scott", category: 'performance', tone: 'defeated' },
        { text: "Sometimes I'll start a sentence and I don't even know where it's going.", source: "The Office", character: "Michael Scott", category: 'performance', tone: 'defeated' },
        { text: "I am dead inside.", source: "Brooklyn Nine-Nine", character: "Rosa Diaz", category: 'resilience', tone: 'defeated' },
      ]
    },
    {
      condition: (m) => m.cognitiveResilience > 55,
      quotes: [
        { text: "I don't want to be an 'us.' I don't even want to be a 'me.' I just want to be nothing.", source: "Fleabag", character: "Fleabag", category: 'resilience', tone: 'defeated' },
        { text: "I find that a duck's opinion of me is very much influenced by whether or not I have bread.", source: "Standup", character: "Mitch Hedberg", category: 'resilience', tone: 'dry' },
        { text: "I don't need you to tell me how good my coffee is.", source: "Pulp Fiction", character: "Jimmie", category: 'resilience', tone: 'sarcastic' },
        { text: "I'm gonna need you to go ahead and come in on Saturday.", source: "Office Space", character: "Bill Lumbergh", category: 'resilience', tone: 'sarcastic' },
      ]
    },
  ];

  private fallbackQuotes: MovieQuote[] = [
    // Film/TV classics
    { text: "As you wish.", source: "The Princess Bride", character: "Westley", category: 'balance', tone: 'dry' },
    { text: "Inconceivable!", source: "The Princess Bride", character: "Vizzini", category: 'performance', tone: 'sarcastic' },
    { text: "Moving right along.", source: "The Muppet Movie", character: "Kermit", category: 'performance', tone: 'dry' },
    { text: "I'll have what she's having.", source: "When Harry Met Sally", character: "Older Woman in Deli", category: 'balance', tone: 'dry' },
    { text: "May the odds be ever in your favor.", source: "The Hunger Games", character: "Effie Trinket", category: 'performance', tone: 'sarcastic' },
    { text: "Cool. Cool cool cool.", source: "Community", character: "Abed Nadir", category: 'performance', tone: 'dry' },
    { text: "I've heard it both ways.", source: "Psych", character: "Shawn Spencer", category: 'performance', tone: 'dry' },
    { text: "Title of your sex tape.", source: "Brooklyn Nine-Nine", character: "Jake Peralta", category: 'performance', tone: 'sarcastic' },
    { text: "Ew, David!", source: "Schitt's Creek", character: "Alexis Rose", category: 'balance', tone: 'sarcastic' },
    { text: "I'm not superstitious, but I am a little stitious.", source: "The Office", character: "Michael Scott", category: 'balance', tone: 'dry' },
    // Standup
    { text: "I used to think the brain was the most important organ. Then I thought, look what's telling me that.", source: "Standup", character: "Emo Philips", category: 'focus', tone: 'dry' },
    { text: "An escalator can never break. It can only become stairs.", source: "Standup", character: "Mitch Hedberg", category: 'resilience', tone: 'dry' },
    { text: "People who think they know everything are a great annoyance to those of us who do.", source: "Quote", character: "Isaac Asimov", category: 'performance', tone: 'sarcastic' },
    { text: "I'm sick of following my dreams. I'm just going to ask them where they're going and hook up with them later.", source: "Standup", character: "Mitch Hedberg", category: 'balance', tone: 'dry' },
    { text: "My grandmother started walking five miles a day when she was sixty. She's ninety-seven now, and we don't know where the heck she is.", source: "Standup", character: "Ellen DeGeneres", category: 'balance', tone: 'dry' },
    // Literature/Famous
    { text: "And so it goes.", source: "Slaughterhouse-Five", character: "Kurt Vonnegut", category: 'performance', tone: 'dry' },
    { text: "Don't Panic.", source: "The Hitchhiker's Guide to the Galaxy", character: "Douglas Adams", category: 'resilience', tone: 'dry' },
    { text: "I love deadlines. I love the whooshing noise they make as they go by.", source: "Quote", character: "Douglas Adams", category: 'focus', tone: 'dry' },
    { text: "Be yourself; everyone else is already taken.", source: "Quote", character: "Oscar Wilde", category: 'performance', tone: 'confident' },
    { text: "Not all those who wander are lost.", source: "The Fellowship of the Ring", character: "J.R.R. Tolkien", category: 'balance', tone: 'motivational' },
    { text: "In the beginning the Universe was created. This has made a lot of people very angry and been widely regarded as a bad move.", source: "The Restaurant at the End of the Universe", character: "Douglas Adams", category: 'performance', tone: 'dry' },
    { text: "If you're going through hell, keep going.", source: "Quote", character: "Winston Churchill", category: 'resilience', tone: 'motivational' },
    { text: "Everybody has a plan until they get punched in the mouth.", source: "Interview", character: "Mike Tyson", category: 'resilience', tone: 'defeated' },
    { text: "The reports of my death are greatly exaggerated.", source: "Quote", character: "Mark Twain", category: 'resilience', tone: 'sarcastic' },
  ];

  generateQuote(metrics: WorkHealthMetrics): MovieQuote {
    // Collect from ALL pools — movie/TV, standup, famous people, literary
    const allPools = [
      ...this.metricBasedQuotes,
      ...this.standupQuotes,
      ...this.standupExtras,
    ];

    const applicableQuotes = allPools
      .filter(rule => rule.condition(metrics))
      .flatMap(rule => rule.quotes);

    // If we have applicable quotes, randomly select one
    if (applicableQuotes.length > 0) {
      const randomIndex = Math.floor(Math.random() * applicableQuotes.length);
      return applicableQuotes[randomIndex];
    }

    // Fallback to general quotes
    const randomIndex = Math.floor(Math.random() * this.fallbackQuotes.length);
    return this.fallbackQuotes[randomIndex];
  }

  generateMultipleQuotes(metrics: WorkHealthMetrics, count: number = 3): MovieQuote[] {
    const quotes: MovieQuote[] = [];
    const used = new Set<string>();

    while (quotes.length < count && used.size < 50) {
      const quote = this.generateQuote(metrics);
      if (!used.has(quote.text)) {
        quotes.push(quote);
        used.add(quote.text);
      }
    }

    return quotes;
  }

  generateCategoryQuote(metrics: WorkHealthMetrics, category: MovieQuote['category']): MovieQuote {
    const allPools = [
      ...this.metricBasedQuotes,
      ...this.standupQuotes,
      ...this.standupExtras,
    ];

    const categoryQuotes = allPools
      .filter(rule => rule.condition(metrics))
      .flatMap(rule => rule.quotes)
      .filter(quote => quote.category === category);

    if (categoryQuotes.length > 0) {
      const randomIndex = Math.floor(Math.random() * categoryQuotes.length);
      return categoryQuotes[randomIndex];
    }

    const generalCategoryQuotes = [
      ...allPools.flatMap(rule => rule.quotes),
      ...this.fallbackQuotes
    ].filter(quote => quote.category === category);

    if (generalCategoryQuotes.length > 0) {
      const randomIndex = Math.floor(Math.random() * generalCategoryQuotes.length);
      return generalCategoryQuotes[randomIndex];
    }

    const randomFallback = Math.floor(Math.random() * this.fallbackQuotes.length);
    return this.fallbackQuotes[randomFallback];
  }

  formatQuote(quote: MovieQuote): string {
    if (quote.character) {
      return `${quote.text} - ${quote.character}, ${quote.source}`;
    }
    return `${quote.text} - ${quote.source}`;
  }

  getTotalQuoteCount(): number {
    const allPools = [
      ...this.metricBasedQuotes,
      ...this.standupQuotes,
      ...this.standupExtras,
    ];
    const metricQuotes = allPools.reduce((total, rule) => total + rule.quotes.length, 0);
    return metricQuotes + this.fallbackQuotes.length;
  }
}

// Export singleton instance
export const comicReliefGenerator = new ComicReliefGenerator();
