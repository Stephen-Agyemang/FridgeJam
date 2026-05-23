import re

def check_css(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    # We want to trace curly braces and identify line numbers of mismatches
    # Let's count open/close braces and also look for lines with unmatched braces.
    lines = content.split('\n')
    brace_stack = []
    errors = []
    
    for idx, line in enumerate(lines):
        line_num = idx + 1
        # Strip comments
        clean_line = re.sub(r'/\*.*?\*/', '', line)
        for char_idx, char in enumerate(clean_line):
            if char == '{':
                brace_stack.append((line_num, line))
            elif char == '}':
                if not brace_stack:
                    errors.append((line_num, "Unmatched closing brace '}'", line))
                else:
                    brace_stack.pop()
                    
    print(f"Total unmatched opening braces: {len(brace_stack)}")
    for line_num, line in brace_stack[:10]:
        print(f"  Line {line_num}: {line.strip()}")
        
    print(f"\nTotal unmatched closing braces: {len(errors)}")
    for line_num, msg, line in errors[:10]:
        print(f"  Line {line_num}: {msg} - {line.strip()}")

if __name__ == '__main__':
    check_css('frontend/style.v4.css')
