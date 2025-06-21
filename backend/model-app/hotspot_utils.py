def get_default_inputs(current_week=None):
    crime_columns = [
        'Alcohol offences, travelling to and from sporting event',
        'Breach of football banning order',
        'Breach of the peace',
        'Carrying of Knives etc S Act 1993',
        'Drunk in or attempting to enter designated sports ground',
        'Mobbing and rioting',
        'Offensive behaviour at football (OBaFaTBSA 2012)',
        'Permitting riotous behaviour in licensed premises',
        'Possession of an offensive weapon',
        'Possession of offensive weapon used in other criminal activity',
        'Public mischief - including wasting police time',
        'Racially aggravated conduct',
        'Racially aggravated harassment',
        'Serious Assault',
        'Sports grounds offences possessing alcohol etc',
        'Stirring up hatred: Racial',
        'Threatening or abusive behaviour',
        'DETECTED CRIME'
    ]
    if current_week is None:
        current_week = "2024-04-29"
    return crime_columns, current_week 