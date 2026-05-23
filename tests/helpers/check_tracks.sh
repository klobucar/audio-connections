FILE=$1
if [ -z "$FILE" ]; then                                                                        
    echo "USAGE: $0 <day-1.ts>"
    exit 1                                                                                                          
fi
RED='\033[1;31m'
GREEN='\033[1;32m'
NC='\033[0m'

echo "NOTE: spelling and punctuation may cause it to not find the track, skim the curl dump and determine if its good enough"
cat $FILE | shuf | grep "id:" | while read a; do
    id=$(echo $a| sed -e "s/,.*//" -e "s/.*: //")
    name=$(echo $a | sed -e "s/.*title: //" -e "s/' },\|\" },//" -e "s/^'\|^\"//")

    echo -n $name"  "
    curl -s https://itunes.apple.com/lookup?id=$id | grep -i "$name" > /dev/null
    if [ $? -eq 0 ]; then
        echo -e "    ${GREEN}(✓)${NC}  found" 
    else 
        echo -e "   ${RED}(x)${NC}  not found \n$a"
        curl -s https://itunes.apple.com/lookup?id=$id
    fi
done
