import { Html2Text } from './Html2Text';

describe('Html2Text', () => {
    it('should convert HTML paragraph with period and line break to text', () => {
        const input = '<p>Alinhamento de primeiras impressões.</p>    <br>Hello';
        const expected = 'Alinhamento de primeiras impressões.\nHello';

        const result = Html2Text(input);

        expect(result).toBe(expected);
    });

    it('long HTML conversion', () => {
        const input =
            '<p>Alinhamento de primeiras impressões</p><ul><li><p>Yhdysvaltain presidentti<strong> Donald Trump</strong> uhkaa Euroopan kahdeksaa maata lisätulleilla, ellei Yhdysvallat saa Grönlantia rahalla tai voimalla.</p></li><li><p>Kahdeksan maata ovat Tanska, Suomi, Ruotsi, Norja, Saksa, Ranska, Alankomaat ja Britannia.</p></li></ul>';
        const expected =
            'Alinhamento de primeiras impressões\n- Yhdysvaltain presidentti Donald Trump uhkaa Euroopan kahdeksaa maata lisätulleilla, ellei Yhdysvallat saa Grönlantia rahalla tai voimalla.\n- Kahdeksan maata ovat Tanska, Suomi, Ruotsi, Norja, Saksa, Ranska, Alankomaat ja Britannia.';

        const result = Html2Text(input);

        expect(result).toBe(expected);
    });

    it('should preserve null input', () => {
        const result = Html2Text(null);
        expect(result).toBeNull();
    });

    it('should preserve undefined input', () => {
        const result = Html2Text(undefined);
        expect(result).toBeUndefined();
    });

    it('should strip script tags', () => {
        const input = '<p>Test</p><script>alert("xss")</script>';
        const result = Html2Text(input);
        expect(result).toBe('Test');
    });

    it('should strip style tags', () => {
        const input = '<p>Test</p><style>body { color: red; }</style>';
        const result = Html2Text(input);
        expect(result).toBe('Test');
    });

    it('should decode HTML entities', () => {
        const input = '&lt;div&gt;Test&nbsp;&amp;&nbsp;Test&lt;/div&gt;';
        const result = Html2Text(input);
        expect(result).toBe('<div>Test & Test</div>');
    });

    it('should collapse multiple spaces', () => {
        const input = '<p>Multiple     spaces    here</p>';
        const result = Html2Text(input);
        expect(result).toBe('Multiple spaces here');
    });

    it('should handle plain text without tags', () => {
        const input = 'Plain text without any tags';
        const result = Html2Text(input);
        expect(result).toBe('Plain text without any tags');
    });

    it('should trim whitespace', () => {
        const input = '   <p>Trimmed</p>   ';
        const result = Html2Text(input);
        expect(result).toBe('Trimmed');
    });

    it('should handle empty string', () => {
        const input = '';
        const result = Html2Text(input);
        expect(result).toBe('');
    });

    it('should handle complex nested HTML', () => {
        const input = '<div><p>First <strong>bold</strong> paragraph</p><p>Second paragraph</p></div>';
        const result = Html2Text(input);
        expect(result).toBe('First bold paragraph\nSecond paragraph');
    });

    it('should format unordered lists with dashes', () => {
        const input = '<ul><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul>';
        const result = Html2Text(input);
        expect(result).toBe('- Item 1\n- Item 2\n- Item 3');
    });

    it('should format ordered lists with dashes', () => {
        const input = '<ol><li>First</li><li>Second</li></ol>';
        const result = Html2Text(input);
        expect(result).toBe('- First\n- Second');
    });

    it('should handle mixed content with lists', () => {
        const input = '<p>Header</p><ul><li>Point A</li><li>Point B</li></ul><p>Footer</p>';
        const result = Html2Text(input);
        expect(result).toBe('Header\n- Point A\n- Point B\nFooter');
    });
});
