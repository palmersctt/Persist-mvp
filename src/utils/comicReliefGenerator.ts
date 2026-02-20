import { WorkHealthMetrics } from '../hooks/useWorkHealth';

interface MovieQuote {
  text: string;
  source: string; // Movie or TV show name
  character?: string; // Character who said it
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
        { text: "I have the high ground!", source: "Star Wars", character: "Obi-Wan", category: 'performance', tone: 'confident' },
        { text: "Are you not entertained?", source: "Gladiator", character: "Maximus", category: 'performance', tone: 'confident' },
        { text: "You bow to no one.", source: "Lord of the Rings", character: "Aragorn", category: 'performance', tone: 'confident' },
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
        { text: "It is what it is.", source: "Generic", character: "Everyone", category: 'performance', tone: 'dry' },
        { text: "Same same, but different.", source: "The Interview", character: "Dave Skylark", category: 'performance', tone: 'dry' },
        { text: "I'm working with a full deck.", source: "Generic Office", character: "Middle Manager", category: 'performance', tone: 'dry' },
        { text: "We're making progress.", source: "Generic Project", character: "Team Lead", category: 'performance', tone: 'dry' },
        { text: "Could be worse.", source: "Generic Life", character: "Optimist", category: 'performance', tone: 'dry' },
        { text: "Meh.", source: "The Simpsons", character: "Bart Simpson", category: 'performance', tone: 'dry' },
        { text: "I've seen worse.", source: "Generic", character: "Everyone", category: 'performance', tone: 'dry' },
      ]
    },

    // POOR Performance (25-49 adaptive performance index)
    {
      condition: (m) => m.adaptivePerformanceIndex >= 25 && m.adaptivePerformanceIndex < 50,
      quotes: [
        { text: "I feel like I'm taking crazy pills!", source: "Zoolander", character: "Derek Zoolander", category: 'performance', tone: 'defeated' },
        { text: "This is fine.", source: "This is Fine Meme", character: "Dog in burning room", category: 'performance', tone: 'sarcastic' },
        { text: "I don't like sand. It's coarse and rough and gets everywhere.", source: "Star Wars", character: "Anakin", category: 'performance', tone: 'defeated' },
        { text: "Why so serious?", source: "The Dark Knight", character: "The Joker", category: 'performance', tone: 'sarcastic' },
        { text: "I'm getting too old for this.", source: "Lethal Weapon", character: "Roger Murtaugh", category: 'performance', tone: 'defeated' },
        { text: "Houston, we have a problem.", source: "Apollo 13", character: "Jim Lovell", category: 'performance', tone: 'defeated' },
        { text: "Well, that escalated quickly.", source: "Anchorman", character: "Ron Burgundy", category: 'performance', tone: 'sarcastic' },
        { text: "I immediately regret this decision.", source: "Anchorman", character: "Ron Burgundy", category: 'performance', tone: 'defeated' },
        { text: "I've made a huge mistake.", source: "Arrested Development", character: "Gob Bluth", category: 'performance', tone: 'defeated' },
        { text: "That's not gone well.", source: "Top Gear", character: "Jeremy Clarkson", category: 'performance', tone: 'defeated' },
        { text: "This isn't going according to plan.", source: "Generic", character: "Everyone", category: 'performance', tone: 'defeated' },
        { text: "Oops.", source: "Generic", character: "Everyone", category: 'performance', tone: 'defeated' },
        { text: "My bad.", source: "Generic", character: "Everyone", category: 'performance', tone: 'defeated' },
        { text: "Plot twist: it got worse.", source: "Generic", character: "Narrator", category: 'performance', tone: 'sarcastic' },
      ]
    },

    // VERY POOR Performance (below 25 adaptive performance index)
    {
      condition: (m) => m.adaptivePerformanceIndex < 25,
      quotes: [
        { text: "I can't even.", source: "Mean Girls", character: "Gretchen Wieners", category: 'performance', tone: 'defeated' },
        { text: "Game over, man! Game over!", source: "Aliens", character: "Hudson", category: 'performance', tone: 'defeated' },
        { text: "I'm not dead yet!", source: "Monty Python and the Holy Grail", character: "Not Dead Yet Man", category: 'performance', tone: 'defeated' },
        { text: "Help me, Obi-Wan Kenobi. You're my only hope.", source: "Star Wars", character: "Princess Leia", category: 'performance', tone: 'defeated' },
        { text: "I see dead people.", source: "The Sixth Sense", character: "Cole Sear", category: 'performance', tone: 'defeated' },
        { text: "Mayday! Mayday!", source: "Generic Aviation", character: "Pilot", category: 'performance', tone: 'defeated' },
        { text: "We're gonna need a bigger boat.", source: "Jaws", character: "Brody", category: 'performance', tone: 'defeated' },
        { text: "Coffee is for closers.", source: "Glengarry Glen Ross", character: "Blake", category: 'performance', tone: 'defeated' },
        { text: "I've got a bad feeling about this.", source: "Star Wars", character: "Han Solo", category: 'performance', tone: 'defeated' },
        { text: "Abort! Abort!", source: "Generic", character: "Mission Control", category: 'performance', tone: 'defeated' },
        { text: "Send more paramedics.", source: "Return of the Living Dead", character: "Paramedic", category: 'performance', tone: 'defeated' },
        { text: "I don't think we're in Kansas anymore.", source: "The Wizard of Oz", character: "Dorothy", category: 'performance', tone: 'defeated' },
      ]
    },

    // BACK-TO-BACK MEETINGS (high back-to-back count)
    {
      condition: (m) => (m.schedule?.backToBackCount && m.schedule.backToBackCount > 3),
      quotes: [
        { text: "I'm running on fumes.", source: "Generic", character: "Everyone", category: 'meetings', tone: 'defeated' },
        { text: "No time to think.", source: "Generic", character: "Everyone", category: 'meetings', tone: 'defeated' },
        { text: "From one thing to another.", source: "Generic", character: "Everyone", category: 'meetings', tone: 'defeated' },
        { text: "Can I get five minutes?", source: "Generic", character: "Everyone", category: 'meetings', tone: 'defeated' },
        { text: "When does this end?", source: "Generic", character: "Everyone", category: 'meetings', tone: 'defeated' },
        { text: "I need a bathroom break.", source: "Generic", character: "Everyone", category: 'meetings', tone: 'sarcastic' },
        { text: "Is there an intermission?", source: "Generic", character: "Everyone", category: 'meetings', tone: 'sarcastic' },
      ]
    },

    // FRAGMENTED SCHEDULE (high fragmentation score)
    {
      condition: (m) => (m.schedule?.fragmentationScore && m.schedule.fragmentationScore > 0.7),
      quotes: [
        { text: "My day is Swiss cheese.", source: "Generic", character: "Everyone", category: 'balance', tone: 'sarcastic' },
        { text: "Scattered like confetti.", source: "Generic", character: "Everyone", category: 'balance', tone: 'defeated' },
        { text: "All over the place.", source: "Generic", character: "Everyone", category: 'balance', tone: 'defeated' },
        { text: "I'm being pulled in every direction.", source: "Generic", character: "Everyone", category: 'balance', tone: 'defeated' },
        { text: "What's a schedule?", source: "Generic", character: "Everyone", category: 'balance', tone: 'sarcastic' },
        { text: "Chaos reigns.", source: "Antichrist", character: "She", category: 'balance', tone: 'defeated' },
      ]
    },

    // VERY HIGH Performance AND High Resilience (showing off)
    {
      condition: (m) => m.adaptivePerformanceIndex >= 85 && m.cognitiveResilience >= 75,
      quotes: [
        { text: "I'm unstoppable!", source: "Generic", character: "Everyone", category: 'performance', tone: 'confident' },
        { text: "Bring it on!", source: "Bring It On", character: "Torrance", category: 'performance', tone: 'confident' },
        { text: "I eat challenges for breakfast.", source: "Generic", character: "Everyone", category: 'performance', tone: 'confident' },
        { text: "This is too easy.", source: "Generic", character: "Everyone", category: 'performance', tone: 'confident' },
        { text: "I was born ready.", source: "Generic", character: "Everyone", category: 'performance', tone: 'confident' },
        { text: "Challenge accepted.", source: "How I Met Your Mother", character: "Barney Stinson", category: 'performance', tone: 'confident' },
      ]
    },

    // LOW Performance AND Low Resilience (double trouble)
    {
      condition: (m) => m.adaptivePerformanceIndex < 40 && m.cognitiveResilience < 40,
      quotes: [
        { text: "I can't even.", source: "Generic", character: "Everyone", category: 'performance', tone: 'defeated' },
        { text: "Everything is falling apart.", source: "Generic", character: "Everyone", category: 'performance', tone: 'defeated' },
        { text: "I'm done.", source: "Generic", character: "Everyone", category: 'performance', tone: 'defeated' },
        { text: "Send help.", source: "Generic", character: "Everyone", category: 'performance', tone: 'defeated' },
        { text: "Mayday! Mayday!", source: "Generic Aviation", character: "Pilot", category: 'performance', tone: 'defeated' },
        { text: "The struggle is real.", source: "Generic Internet", character: "Millennial", category: 'performance', tone: 'defeated' },
        { text: "I surrender.", source: "Generic", character: "Everyone", category: 'performance', tone: 'defeated' },
      ]
    },

    // MEETING OVERLOAD (high meeting density OR many meetings)
    {
      condition: (m) => m.meetingDensity > 0.6 || (m.schedule?.meetingCount && m.schedule.meetingCount > 5),
      quotes: [
        { text: "I have a very particular set of skills.", source: "Taken", character: "Bryan Mills", category: 'meetings', tone: 'dry' },
        { text: "Nobody puts Baby in a corner.", source: "Dirty Dancing", character: "Johnny", category: 'meetings', tone: 'sarcastic' },
        { text: "I'm going to make him an offer he can't refuse.", source: "The Godfather", character: "Vito Corleone", category: 'meetings', tone: 'defeated' },
        { text: "I'm surrounded by idiots.", source: "The Lion King", character: "Scar", category: 'meetings', tone: 'sarcastic' },
        { text: "That's what she said.", source: "The Office", character: "Michael Scott", category: 'meetings', tone: 'sarcastic' },
        { text: "I'm not locked in here with you. You're locked in here with me!", source: "Watchmen", character: "Rorschach", category: 'meetings', tone: 'defeated' },
        { text: "The horror... the horror.", source: "Apocalypse Now", character: "Kurtz", category: 'meetings', tone: 'defeated' },
        { text: "Roads? Where we're going, we don't need roads.", source: "Back to the Future", character: "Doc Brown", category: 'meetings', tone: 'sarcastic' },
        { text: "I find your lack of faith disturbing.", source: "Star Wars", character: "Darth Vader", category: 'meetings', tone: 'sarcastic' },
        { text: "Frankly, Scarlett, I don't give a damn.", source: "Gone with the Wind", character: "Rhett Butler", category: 'meetings', tone: 'defeated' },
        { text: "I feel like I'm losing my mind.", source: "Generic", character: "Everyone", category: 'meetings', tone: 'defeated' },
        { text: "Can we just get to the point?", source: "Generic", character: "Everyone", category: 'meetings', tone: 'sarcastic' },
        { text: "This could have been an email.", source: "Generic Office", character: "Employee", category: 'meetings', tone: 'sarcastic' },
        { text: "Let's circle back on that.", source: "Generic Corporate", character: "Manager", category: 'meetings', tone: 'sarcastic' },
        { text: "I'm gonna need you to come in on Saturday.", source: "Office Space", character: "Bill Lumbergh", category: 'meetings', tone: 'defeated' },
        { text: "PC Load Letter? What the fuck does that mean?", source: "Office Space", character: "Michael Bolton", category: 'meetings', tone: 'defeated' },
        { text: "I have people skills!", source: "Office Space", character: "Tom Smykowski", category: 'meetings', tone: 'defeated' },
        { text: "That would be great.", source: "Office Space", character: "Bill Lumbergh", category: 'meetings', tone: 'sarcastic' },
        { text: "Did you get the memo?", source: "Office Space", character: "Bill Lumbergh", category: 'meetings', tone: 'sarcastic' },
      ]
    },

    // LOW FOCUS TIME (less than 2 hours)
    {
      condition: (m) => m.focusTime < 120,
      quotes: [
        { text: "Life is like a box of chocolates. You never know what you're gonna get.", source: "Forrest Gump", character: "Forrest", category: 'focus', tone: 'dry' },
        { text: "Badges? We ain't got no badges! We don't need no badges!", source: "The Treasure of the Sierra Madre", character: "Gold Hat", category: 'focus', tone: 'sarcastic' },
        { text: "My brain hurts!", source: "Monty Python and the Holy Grail", character: "Arthur", category: 'focus', tone: 'defeated' },
        { text: "I know kung fu.", source: "The Matrix", character: "Neo", category: 'focus', tone: 'sarcastic' },
        { text: "There is no spoon.", source: "The Matrix", character: "Spoon Boy", category: 'focus', tone: 'dry' },
        { text: "What's in the box?", source: "Se7en", character: "Mills", category: 'focus', tone: 'defeated' },
        { text: "Wait, what?", source: "Generic", character: "Everyone", category: 'focus', tone: 'defeated' },
        { text: "I'm confused.", source: "Generic", character: "Everyone", category: 'focus', tone: 'defeated' },
        { text: "Squirrel!", source: "Up", character: "Dug", category: 'focus', tone: 'sarcastic' },
        { text: "Where was I? Oh right, nowhere.", source: "Generic", character: "Everyone", category: 'focus', tone: 'defeated' },
        { text: "I forgot what I was doing.", source: "Generic", character: "Everyone", category: 'focus', tone: 'defeated' },
        { text: "Look, a distraction!", source: "Generic", character: "Everyone", category: 'focus', tone: 'sarcastic' },
        { text: "I have the attention span of a goldfish.", source: "Generic", character: "Everyone", category: 'focus', tone: 'defeated' },
        { text: "Focus? What's that?", source: "Generic", character: "Everyone", category: 'focus', tone: 'sarcastic' },
        { text: "Sorry, what were we talking about?", source: "Generic", character: "Everyone", category: 'focus', tone: 'defeated' },
        { text: "My mind is elsewhere.", source: "Generic", character: "Everyone", category: 'focus', tone: 'defeated' },
        { text: "I'm scatterbrained today.", source: "Generic", character: "Everyone", category: 'focus', tone: 'defeated' },
      ]
    },

    // HIGH RESILIENCE (80+ cognitive resilience)
    {
      condition: (m) => m.cognitiveResilience >= 80,
      quotes: [
        { text: "I can do this all day.", source: "Captain America", character: "Steve Rogers", category: 'resilience', tone: 'confident' },
        { text: "What we do in life echoes in eternity.", source: "Gladiator", character: "Maximus", category: 'resilience', tone: 'motivational' },
        { text: "You either die a hero, or you live long enough to see yourself become the villain.", source: "The Dark Knight", character: "Harvey Dent", category: 'resilience', tone: 'dry' },
        { text: "Do or do not, there is no try.", source: "Star Wars", character: "Yoda", category: 'resilience', tone: 'motivational' },
        { text: "I am Iron Man.", source: "Iron Man", character: "Tony Stark", category: 'resilience', tone: 'confident' },
        { text: "With great power comes great responsibility.", source: "Spider-Man", character: "Uncle Ben", category: 'resilience', tone: 'motivational' },
        { text: "I'm not wearing hockey pads.", source: "The Dark Knight", character: "Batman", category: 'resilience', tone: 'confident' },
        { text: "Bring me Thanos!", source: "Avengers: Infinity War", character: "Thor", category: 'resilience', tone: 'confident' },
      ]
    },

    // LOW RESILIENCE (below 40 cognitive resilience)
    {
      condition: (m) => m.cognitiveResilience < 40,
      quotes: [
        { text: "I'm melting! Melting!", source: "The Wizard of Oz", character: "Wicked Witch", category: 'resilience', tone: 'defeated' },
        { text: "I can't take it anymore!", source: "Network", character: "Howard Beale", category: 'resilience', tone: 'defeated' },
        { text: "The dude abides.", source: "The Big Lebowski", character: "The Dude", category: 'resilience', tone: 'defeated' },
        { text: "I'm tired, boss.", source: "The Green Mile", character: "John Coffey", category: 'resilience', tone: 'defeated' },
        { text: "I need a vacation.", source: "Generic", character: "Everyone", category: 'resilience', tone: 'defeated' },
        { text: "Is it Friday yet?", source: "Generic", character: "Everyone", category: 'resilience', tone: 'defeated' },
        { text: "Send help.", source: "Generic", character: "Everyone", category: 'resilience', tone: 'defeated' },
        { text: "Why is this happening to me?", source: "Generic", character: "Everyone", category: 'resilience', tone: 'defeated' },
      ]
    },

    // POOR WORK RHYTHM RECOVERY (below 30)
    {
      condition: (m) => m.workRhythmRecovery < 30,
      quotes: [
        { text: "Everything is terrible.", source: "The Lego Movie", character: "Batman", category: 'balance', tone: 'defeated' },
        { text: "This is the worst day ever.", source: "Generic", character: "Everyone", category: 'balance', tone: 'defeated' },
        { text: "I want to go home.", source: "E.T.", character: "E.T.", category: 'balance', tone: 'defeated' },
        { text: "Make it stop.", source: "Generic", character: "Everyone", category: 'balance', tone: 'defeated' },
        { text: "When will this end?", source: "Generic", character: "Everyone", category: 'balance', tone: 'defeated' },
        { text: "I quit.", source: "Generic", character: "Everyone", category: 'balance', tone: 'defeated' },
        { text: "Nope.", source: "Generic", character: "Everyone", category: 'balance', tone: 'defeated' },
        { text: "Not today, Satan.", source: "RuPaul's Drag Race", character: "Bianca Del Rio", category: 'balance', tone: 'sarcastic' },
      ]
    },

    // GOOD WORK RHYTHM RECOVERY (70+)
    {
      condition: (m) => m.workRhythmRecovery >= 70,
      quotes: [
        { text: "Everything is awesome!", source: "The Lego Movie", character: "Emmet", category: 'balance', tone: 'motivational' },
        { text: "Hakuna Matata!", source: "The Lion King", character: "Timon & Pumbaa", category: 'balance', tone: 'motivational' },
        { text: "Life finds a way.", source: "Jurassic Park", character: "Ian Malcolm", category: 'balance', tone: 'confident' },
        { text: "Today is a good day to die.", source: "Star Trek", character: "Worf", category: 'balance', tone: 'confident' },
        { text: "I'm having a wonderful time.", source: "Generic", character: "Everyone", category: 'balance', tone: 'confident' },
        { text: "This is the way.", source: "The Mandalorian", character: "Mandalorian", category: 'balance', tone: 'confident' },
        { text: "Excellent!", source: "Bill & Ted's Excellent Adventure", character: "Bill & Ted", category: 'balance', tone: 'confident' },
        { text: "Groovy.", source: "Army of Darkness", character: "Ash", category: 'balance', tone: 'confident' },
      ]
    },

    // GREAT FOCUS TIME (4+ hours)
    {
      condition: (m) => m.focusTime >= 240,
      quotes: [
        { text: "I'm in the zone.", source: "Generic Sports", character: "Athlete", category: 'focus', tone: 'confident' },
        { text: "The Force is strong with this one.", source: "Star Wars", character: "Darth Vader", category: 'focus', tone: 'confident' },
        { text: "I see everything.", source: "The Matrix", character: "Neo", category: 'focus', tone: 'confident' },
        { text: "My focus is unshakeable.", source: "Generic", character: "Monk", category: 'focus', tone: 'confident' },
        { text: "Wax on, wax off.", source: "The Karate Kid", character: "Mr. Miyagi", category: 'focus', tone: 'motivational' },
        { text: "There is no try, only do.", source: "Star Wars", character: "Yoda", category: 'focus', tone: 'motivational' },
        { text: "One does not simply walk into Mordor.", source: "Lord of the Rings", character: "Boromir", category: 'focus', tone: 'dry' },
        { text: "Precision is key.", source: "Generic", character: "Sniper", category: 'focus', tone: 'confident' },
        { text: "I am one with the Force, the Force is with me.", source: "Rogue One", character: "Chirrut Îmwe", category: 'focus', tone: 'motivational' },
        { text: "Now I am become Death, destroyer of worlds.", source: "Oppenheimer", character: "J. Robert Oppenheimer", category: 'focus', tone: 'confident' },
        { text: "I can see clearly now.", source: "I Can See Clearly Now", character: "Johnny Nash", category: 'focus', tone: 'confident' },
        { text: "Everything is crystal clear.", source: "Generic", character: "Everyone", category: 'focus', tone: 'confident' },
        { text: "Locked and loaded.", source: "Generic Military", character: "Soldier", category: 'focus', tone: 'confident' },
        { text: "Target acquired.", source: "Generic Military", character: "Sniper", category: 'focus', tone: 'confident' },
        { text: "I'm dialed in.", source: "Generic Sports", character: "Athlete", category: 'focus', tone: 'confident' },
      ]
    },

    // MODERATE Performance with GREAT Focus Time (doing well in focused work)
    {
      condition: (m) => m.adaptivePerformanceIndex >= 60 && m.adaptivePerformanceIndex < 80 && m.focusTime >= 240,
      quotes: [
        { text: "Slow and steady wins the race.", source: "The Tortoise and the Hare", character: "Tortoise", category: 'focus', tone: 'motivational' },
        { text: "Quality over quantity.", source: "Generic", character: "Everyone", category: 'focus', tone: 'confident' },
        { text: "Deep work pays off.", source: "Generic", character: "Everyone", category: 'focus', tone: 'confident' },
        { text: "In the zone.", source: "Generic Sports", character: "Athlete", category: 'focus', tone: 'confident' },
        { text: "Making it count.", source: "Generic", character: "Everyone", category: 'focus', tone: 'confident' },
        { text: "Focused like a laser.", source: "Generic", character: "Everyone", category: 'focus', tone: 'confident' },
      ]
    },

    // HIGH Cognitive Availability (legacy metric compatibility)
    {
      condition: (m) => m.cognitiveAvailability >= 80,
      quotes: [
        { text: "My mind is sharp.", source: "Generic", character: "Everyone", category: 'performance', tone: 'confident' },
        { text: "Thinking clearly.", source: "Generic", character: "Everyone", category: 'performance', tone: 'confident' },
        { text: "All systems go.", source: "Generic NASA", character: "Mission Control", category: 'performance', tone: 'confident' },
        { text: "Operating at full capacity.", source: "Generic", character: "Everyone", category: 'performance', tone: 'confident' },
        { text: "Firing on all cylinders.", source: "Generic", character: "Everyone", category: 'performance', tone: 'confident' },
      ]
    },

    // LOW Cognitive Availability (legacy metric compatibility)
    {
      condition: (m) => m.cognitiveAvailability < 30,
      quotes: [
        { text: "My brain is fried.", source: "Generic", character: "Everyone", category: 'performance', tone: 'defeated' },
        { text: "Running on empty.", source: "Generic", character: "Everyone", category: 'performance', tone: 'defeated' },
        { text: "System overload.", source: "Generic Tech", character: "Computer", category: 'performance', tone: 'defeated' },
        { text: "Need to reboot.", source: "Generic Tech", character: "IT Person", category: 'performance', tone: 'defeated' },
        { text: "404: Brain not found.", source: "Generic Internet", character: "Error Message", category: 'performance', tone: 'sarcastic' },
      ]
    }
  ];

  private fallbackQuotes: MovieQuote[] = [
    // General neutral quotes for when no specific conditions match
    { text: "Here's looking at you, kid.", source: "Casablanca", character: "Rick Blaine", category: 'performance', tone: 'dry' },
    { text: "I'm not superstitious, but I am a little stitious.", source: "The Office", character: "Michael Scott", category: 'balance', tone: 'dry' },
    { text: "That's what she said.", source: "The Office", character: "Michael Scott", category: 'balance', tone: 'sarcastic' },
    { text: "Bears. Beets. Battlestar Galactica.", source: "The Office", character: "Jim Halpert", category: 'performance', tone: 'dry' },
    { text: "Why so serious?", source: "The Dark Knight", character: "The Joker", category: 'performance', tone: 'sarcastic' },
    { text: "I have spoken.", source: "The Mandalorian", character: "Kuiil", category: 'performance', tone: 'confident' },
    { text: "As you wish.", source: "The Princess Bride", character: "Westley", category: 'balance', tone: 'dry' },
    { text: "Inconceivable!", source: "The Princess Bride", character: "Vizzini", category: 'performance', tone: 'sarcastic' },
    { text: "Hello there.", source: "Star Wars", character: "Obi-Wan", category: 'performance', tone: 'dry' },
    { text: "This is the way.", source: "The Mandalorian", character: "Mandalorian", category: 'performance', tone: 'confident' },
    { text: "Just another day at the office.", source: "Generic", character: "Everyone", category: 'performance', tone: 'dry' },
    { text: "Business as usual.", source: "Generic", character: "Everyone", category: 'performance', tone: 'dry' },
    { text: "Nothing to see here.", source: "Generic", character: "Everyone", category: 'performance', tone: 'dry' },
    { text: "Moving right along.", source: "The Muppet Movie", character: "Kermit", category: 'performance', tone: 'dry' },
    { text: "And so it goes.", source: "Slaughterhouse-Five", character: "Kurt Vonnegut", category: 'performance', tone: 'dry' },
    { text: "C'est la vie.", source: "French Expression", character: "French People", category: 'balance', tone: 'dry' },
    { text: "Such is life.", source: "Generic", character: "Everyone", category: 'balance', tone: 'dry' },
    { text: "What are you gonna do?", source: "Generic", character: "Everyone", category: 'balance', tone: 'dry' },
    { text: "Another day, another dollar.", source: "Generic", character: "Everyone", category: 'performance', tone: 'dry' },
    { text: "Keep calm and carry on.", source: "British Poster", character: "British Government", category: 'resilience', tone: 'motivational' },
  ];

  generateQuote(metrics: WorkHealthMetrics): MovieQuote {
    // Find all applicable conditions and collect their quotes
    const applicableQuotes = this.metricBasedQuotes
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

    // Try to get diverse quotes
    while (quotes.length < count && used.size < 50) { // Prevent infinite loop
      const quote = this.generateQuote(metrics);
      if (!used.has(quote.text)) {
        quotes.push(quote);
        used.add(quote.text);
      }
    }

    return quotes;
  }

  // Get quote focused on a specific category
  generateCategoryQuote(metrics: WorkHealthMetrics, category: MovieQuote['category']): MovieQuote {
    const categoryQuotes = this.metricBasedQuotes
      .filter(rule => rule.condition(metrics))
      .flatMap(rule => rule.quotes)
      .filter(quote => quote.category === category);

    if (categoryQuotes.length > 0) {
      const randomIndex = Math.floor(Math.random() * categoryQuotes.length);
      return categoryQuotes[randomIndex];
    }

    // Fallback to general category quotes
    const generalCategoryQuotes = [
      ...this.metricBasedQuotes.flatMap(rule => rule.quotes),
      ...this.fallbackQuotes
    ].filter(quote => quote.category === category);

    if (generalCategoryQuotes.length > 0) {
      const randomIndex = Math.floor(Math.random() * generalCategoryQuotes.length);
      return generalCategoryQuotes[randomIndex];
    }

    // Ultimate fallback - ensure we always return something
    const randomFallback = Math.floor(Math.random() * this.fallbackQuotes.length);
    return this.fallbackQuotes[randomFallback];
  }

  // Format quote with attribution
  formatQuote(quote: MovieQuote): string {
    if (quote.character) {
      return `${quote.text} - ${quote.character}, ${quote.source}`;
    }
    return `${quote.text} - ${quote.source}`;
  }

  // Debug method to see which conditions are being matched
  debugMatchingConditions(metrics: WorkHealthMetrics): string[] {
    return this.metricBasedQuotes
      .map((rule, index) => ({ rule, index }))
      .filter(({ rule }) => rule.condition(metrics))
      .map(({ index }) => `Rule ${index}: ${this.metricBasedQuotes[index].quotes.length} quotes available`);
  }

  // Get total quote count for debugging
  getTotalQuoteCount(): number {
    const metricQuotes = this.metricBasedQuotes.reduce((total, rule) => total + rule.quotes.length, 0);
    return metricQuotes + this.fallbackQuotes.length;
  }

  // Get quote distribution by category
  getQuoteDistribution(): { [key: string]: number } {
    const allQuotes = [
      ...this.metricBasedQuotes.flatMap(rule => rule.quotes),
      ...this.fallbackQuotes
    ];

    return allQuotes.reduce((dist, quote) => {
      dist[quote.category] = (dist[quote.category] || 0) + 1;
      return dist;
    }, {} as { [key: string]: number });
  }
}

// Export singleton instance
export const comicReliefGenerator = new ComicReliefGenerator();